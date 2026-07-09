/**
 * ingest:读 sources.yaml → 逐源发现 skill → 哈希去重 → 写 catalog/
 * 用法:npm run ingest [-- --limit 20] [-- --source anthropics/skills]
 */
import { mkdir, readFile, writeFile, readdir, stat, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { ListReport, SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "../sources/official.ts";
import type { ListDraft } from "../sources/github-search.ts";
import { CATALOG, loadCatalogEntries, entryDir } from "../catalog.ts";
import { loadLists, writeList, addItem, recomputeWorkSignals } from "../lists.ts";
import { CONTEXT_SIZE_COUNTER_ID } from "../context-size.ts";
import { categorize } from "../categorize.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** 镜像单文件上限:超过则跳过不镜像(挡编译产物/大二进制进 git)。可用 MIRROR_MAX_FILE_MB 覆盖。 */
const MIRROR_MAX_BYTES = (Number(process.env.MIRROR_MAX_FILE_MB) || 2) * 1024 * 1024;

// 镜像时跳过的目录名。首要是 .git:拷进 mirror/.git 会让 catalog 把 mirror/ 当 gitlink(子模块),
// 结果镜像内容根本没被 catalog 跟踪,还塞一堆嵌套 VCS 元数据。.svn/.hg 同理。
const MIRROR_SKIP_DIRS = new Set([".git", ".svn", ".hg"]);

/**
 * 过滤式镜像拷贝:递归复制 src→dest,跳过 .git/.svn/.hg 目录与单文件超过 maxBytes 的文件。
 * 账本(Git catalog)只该装 SKILL.md 与小体积文本资产;大 blob(编译产物、数据集)属于对象存储,
 * 不属于 Git——见《走向百万级》。返回被跳过的大文件(相对路径 + 字节),供上层置 mirror_complete=false。
 * 用 stat(跟随 symlink)+ copyFile,等价旧 `cp({dereference:true})`(合集仓常用软链共享)。
 */
async function copyMirrorFiltered(src: string, dest: string, maxBytes: number): Promise<{ path: string; bytes: number }[]> {
  const skipped: { path: string; bytes: number }[] = [];
  async function walk(rel: string): Promise<void> {
    for (const name of await readdir(join(src, rel))) {
      if (MIRROR_SKIP_DIRS.has(name)) continue; // .git 等不进镜像(拷进去会让 catalog 把 mirror 当 gitlink)
      const r = rel ? join(rel, name) : name;
      const st = await stat(join(src, r)); // 跟随 symlink
      if (st.isDirectory()) {
        await mkdir(join(dest, r), { recursive: true });
        await walk(r);
      } else if (st.isFile()) {
        if (st.size > maxBytes) { skipped.push({ path: r, bytes: st.size }); continue; }
        await mkdir(dirname(join(dest, r)), { recursive: true });
        await copyFile(join(src, r), join(dest, r));
      }
    }
  }
  await mkdir(dest, { recursive: true });
  await walk("");
  return skipped;
}

/**
 * 仓级证注入:托管资格来自仓根 LICENSE 时,把证拷进 mirror/LICENSE.upstream——
 * 宽松证(MIT/Apache 等)允许再分发的条件正是「附带许可文本」,证不随包走则形式违约(2026-07-09 缺口)。
 * ⚠ LICENSE.upstream 是保留名:CLI dirContentHash 与 web admit() 均跳过它,不参与内容哈希。
 * 幂等(已存在不重写),失败静默不阻断采集。
 */
async function injectLicense(c: SkillCandidate, mirrorDir: string): Promise<boolean> {
  if (!c.licenseSrcPath) return false;
  const dest = join(mirrorDir, "LICENSE.upstream");
  if (existsSync(dest)) return false;
  try {
    await copyFile(c.licenseSrcPath, dest);
    return true;
  } catch {
    return false;
  }
}

/** 加载 catalog 已有条目:id → 报告(用于跨运行去重 + 保留审计/评测/人工结果) */
async function loadExisting(): Promise<Map<string, SkillReport>> {
  const out = new Map<string, SkillReport>();
  for (const e of await loadCatalogEntries()) out.set(e.report.meta.id, e.report);
  return out;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const limit = arg("limit") ? Number(arg("limit")) : Infinity;
  const onlySource = arg("source");

  // 两段式采集:默认「索引层」——只写元数据,不下载 mirror 副本(海量、近零成本、不炸);
  // 加 --mirror 才进「托管层」——为 licence 允许的 skill 下载完整副本(仅少量认证 skill 需要)。
  if (process.argv.includes("--mirror")) process.env.INGEST_MIRROR = "1";
  console.log(`采集模式: ${process.env.INGEST_MIRROR === "1" ? "托管层(索引 + 镜像副本)" : "索引层(仅元数据,不镜像)"}`);

  const sourcesFile = parse(await readFile(join(ROOT, "sources.yaml"), "utf8")) as {
    sources: { type: string; repo: string; category?: string }[];
  };
  // per-source 分类覆盖:sources.yaml 的 category 字段(用于同质垂直仓,如 microsoft/azure-skills → cloud),
  // 优先于启发式。异质仓(anthropics/vercel 等混合品类)不要设,交给引擎逐条判。
  const catOverride = new Map<string, string>();
  for (const s of sourcesFile.sources) if (s.category) catOverride.set(s.repo.toLowerCase(), s.category);
  const overrideFor = (id: string): string | undefined => {
    const [owner, repo] = id.split("/");
    return catOverride.get(`${owner}/${repo}`.toLowerCase());
  };
  const repos = sourcesFile.sources
    .filter((s) => s.type === "github-repo")
    .map((s) => s.repo)
    .filter((r) => !onlySource || r === onlySource);

  const all: SkillCandidate[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const repo of repos) {
    console.log(`\n▶ 采集 ${repo} …`);
    const { candidates, cleanup } = await discoverFromRepo(repo);
    cleanups.push(cleanup);
    console.log(`  发现 ${candidates.length} 个 skill`);
    all.push(...candidates);
    if (all.length >= limit) break;
  }

  // Hub 精选信号(--hub-signals [N]);解析社区 awesome-list,回上游采集,注入 curated_by + category
  if (process.argv.includes("--hub-signals")) {
    const n = Number(arg("hub-signals")) || 300;
    console.log(`\n▶ 采集 Hub 精选信号(awesome-list)上限 ${n} …`);
    const { discoverFromHubSignals } = await import("../sources/hub-signals.ts");
    const { candidates, cleanup } = await discoverFromHubSignals(n);
    cleanups.push(cleanup);
    console.log(`  发现 ${candidates.length} 个 skill`);
    all.push(...candidates);
  }

  // W3c:GitHub 全域(--github-search [N]);按 skill topic 搜头部仓库,需 api.github.com 可达
  // ADR 0019:已拦截仓跳克隆;新仓 ≥ BULK_SIGNAL_ONLY 拦截零候选;>cap 灰区折叠采样——均产出清单草稿
  const listsMap = await loadLists();
  const blockedIds = new Set([...listsMap.values()].filter((l) => l.blocked).map((l) => l.id.toLowerCase()));
  const listDrafts: ListDraft[] = [];
  if (process.argv.includes("--github-search")) {
    const n = Number(arg("github-search")) || 100;
    console.log(`\n▶ 采集 GitHub 全域头部 ${n} 个仓库 …`);
    const { discoverFromGitHub } = await import("../sources/github-search.ts");
    const { candidates, lists: drafts, cleanup } = await discoverFromGitHub(n, blockedIds);
    cleanups.push(cleanup);
    listDrafts.push(...drafts);
    console.log(`  发现 ${candidates.length} 个 skill,${drafts.length} 条清单草稿`);
    all.push(...candidates);
  }

  // skills.sh 安装量榜(--skills-sh [N]);解析首页 SSR 榜单,内容回上游采集
  if (process.argv.includes("--skills-sh")) {
    const n = Number(arg("skills-sh")) || 200;
    console.log(`\n▶ 采集 skills.sh 头部 ${n} 条 …`);
    const { discoverFromSkillsSh } = await import("../sources/skills-sh.ts");
    const { candidates, cleanup } = await discoverFromSkillsSh(n);
    cleanups.push(cleanup);
    console.log(`  发现 ${candidates.length} 个 skill`);
    all.push(...candidates);
  }

  // 跨运行 + 跨源哈希去重,canonical 选择规则(竞品均为先到先得,这里做归属还原):
  //   1) catalog 已有条目优先(稳定,不因重跑漂移),且优先取本身非 duplicate 的条目;
  //   2) 本次新出现的哈希:sources.yaml 官方源 > stars 最高者(搬运仓 star 通常低于原作者仓,
  //      但官方源不注入 stars,须显式优先,否则会输给搬运它的高星聚合仓)。
  const officialOwners = new Set(
    sourcesFile.sources.filter((s) => s.type === "github-repo").map((s) => s.repo.split("/")[0].toLowerCase()),
  );
  const canonRank = (c: SkillCandidate) =>
    officialOwners.has(c.report.meta.id.split("/")[0]) ? Infinity : (c.report.signals.stars_github ?? -1);
  const existing = await loadExisting();
  const byHash = new Map<string, string>();
  for (const r of existing.values())
    if (!r.meta.duplicate_of && !byHash.has(r.meta.content_hash)) byHash.set(r.meta.content_hash, r.meta.id);
  for (const r of existing.values())
    if (!byHash.has(r.meta.content_hash)) byHash.set(r.meta.content_hash, r.meta.id);

  const byHashGroups = new Map<string, SkillCandidate[]>();
  for (const c of all) {
    const h = c.report.meta.content_hash;
    (byHashGroups.get(h) ?? byHashGroups.set(h, []).get(h)!).push(c);
  }
  // ADR 0019:hash 命中 canonical 的跨仓拷贝不再落条目(旧行为:写带 duplicate_of 的条目)。
  // 改记 appearance——引用进来源仓的清单 items(幂等账本),canonical 的 appear_count/list_count 随后重算。
  // 同仓同内容(改名/软链)也不落,但不算外部出现。
  const dropIds = new Set<string>();
  const appearanceQueue: { canonical: string; sourceRepo: string; name: string }[] = [];
  let sameRepoDup = 0;
  for (const [h, group] of byHashGroups) {
    let canonical = byHash.get(h);
    if (!canonical) {
      let best = group[0];
      for (const c of group) if (canonRank(c) > canonRank(best)) best = c;
      canonical = best.report.meta.id;
      byHash.set(h, canonical);
    }
    for (const c of group) {
      if (c.report.meta.id === canonical) continue; // 同 id 覆盖更新不算重复
      dropIds.add(c.report.meta.id);
      const srcRepo = c.report.meta.id.split("/").slice(0, 2).join("/");
      const canonRepo = canonical.split("/").slice(0, 2).join("/");
      if (srcRepo === canonRepo) { sameRepoDup++; continue; }
      appearanceQueue.push({ canonical, sourceRepo: srcRepo, name: c.report.meta.name });
    }
  }

  // 同 id 去重:一次运行内同 id 只保留第一条(避免同一 skill 被多源重复写);
  // 跨仓拷贝(dropIds)与已拦截仓的候选(兜其他源漏进来的)在此出局
  const byId = new Map<string, SkillCandidate>();
  let blockedSkipped = 0;
  for (const c of all.slice(0, limit)) {
    const id = c.report.meta.id;
    if (dropIds.has(id)) continue;
    if (blockedIds.has(id.split("/").slice(0, 2).join("/"))) { blockedSkipped++; continue; }
    if (!byId.has(id)) byId.set(id, c);
  }

  let written = 0;
  const stats = { added: 0, updated: 0, unchanged: 0, backfilled: 0, preserved: 0, fmInvalid: 0, uncategorized: 0, mirrorSkipped: 0, mirrorBackfilled: 0, licenseInjected: 0 };
  const touched: { skill_id: string; content_hash: string }[] = [];
  for (const c of byId.values()) {
    const prev = existing.get(c.report.meta.id);

    // 内容与上游 commit 都没变、且已归类 → 跳过(幂等,不产生噪音 diff)。
    // 加 category != null 是为了给旧条目回填分类:首次接入后,存量条目会被重新归类一次。
    // 缺 context_size **或计数器版本过旧**的存量条目(ADR 0015)做**外科式回填/升级**:
    // 只把新算的 context_size 补进旧报告,其余(category/tags/copy/eval)原样保留——
    // 不走完整更新路径,避免启发式归类冲掉 categorize:llm 的权威判定、或把微文案 copy 块整个丢掉。
    if (prev && prev.meta.content_hash === c.report.meta.content_hash &&
        prev.meta.upstream_commit === c.report.meta.upstream_commit &&
        prev.meta.category != null) {
      // 内容与上游 HEAD 都没变的存量条目:仍外科式回填缺失字段(不走完整更新路径,保下游成果)
      let patched = false;
      if ((prev.context_size == null || prev.context_size.counter.id !== CONTEXT_SIZE_COUNTER_ID) &&
          c.report.context_size != null) {
        prev.context_size = c.report.context_size;
        patched = true;
      }
      // upstream_commit_at 缺失回填(ADR 0016 预留的上游时间信号):HEAD 未变 → 值稳定,写一次即定、不重复写
      if (prev.signals.upstream_commit_at == null && c.report.signals.upstream_commit_at != null) {
        prev.signals.upstream_commit_at = c.report.signals.upstream_commit_at;
        patched = true;
      }
      // 镜像补齐(--mirror 重跑,服务 .skill 下载通道):licence 允许(mirrorSrcDir 有值)而磁盘无副本的
      // 存量条目,外科式落副本并把 hosting 对齐磁盘事实——内容没变,变的只是「本店是否实际托管」。
      // 此前该分支不搬镜像,--mirror 对存量未变条目是空跑(2026-07-08 首发包补镜像时暴露)。
      if (c.mirrorSrcDir && !existsSync(join(entryDir(prev.meta.id), "mirror"))) {
        const mDir = join(entryDir(prev.meta.id), "mirror");
        const skipped = await copyMirrorFiltered(c.mirrorSrcDir, mDir, MIRROR_MAX_BYTES)
          .catch((e) => { console.warn(`  ⚠ 镜像补齐 ${prev.meta.id} 失败,保持 indexed: ${(e as Error).message}`); return null; });
        if (skipped === null) {
          await rm(mDir, { recursive: true, force: true }).catch(() => {});
        } else {
          prev.meta.hosting = "mirrored";
          prev.meta.mirror_complete = skipped.length === 0;
          for (const s of skipped) {
            stats.mirrorSkipped++;
            console.warn(`  ⚠ 镜像跳过大文件(不入 git)${prev.meta.id}/${s.path} — ${(s.bytes / 1048576).toFixed(1)}MB > ${(MIRROR_MAX_BYTES / 1048576).toFixed(0)}MB`);
          }
          stats.mirrorBackfilled++;
          patched = true;
        }
      }
      // 仓级证注入(存量补证):镜像在而证缺 → 补 LICENSE.upstream(纯文件补充,不动报告字段)
      {
        const mDir = join(entryDir(prev.meta.id), "mirror");
        if (existsSync(mDir) && (await injectLicense(c, mDir))) stats.licenseInjected++;
      }
      if (patched) {
        await writeFile(join(entryDir(prev.meta.id), "skill-report.json"), JSON.stringify(prev, null, 2) + "\n");
        stats.backfilled++;
      } else {
        stats.unchanged++;
      }
      continue;
    }

    // 同 id 更新:保留已有的评测结果(采集只负责元数据,不冲掉下游成果)。
    // v2(ADR 0012):判定在 catalog/verdicts 账本,锚定 content_hash,采集天然不会冲掉;
    // 内容变化的重新判定由服务侧 submit(幂等)触发,不在采集职责内。
    if (prev?.eval) {
      c.report.eval = prev.eval;
      stats.preserved++;
    }

    // 微文案同理:copy 锚 meta.content_hash,内容没变(hash 相同)则沿用(含 M1 author 稿);
    // 变了 = 锚过期,这里不带,由 categorize:llm 重算。此前更新路径会无条件丢 copy,
    // 上游 commit 前进而 skill 目录未动时就白丢——现在按锚语义保留。
    if (prev?.copy && prev.copy.content_hash === c.report.meta.content_hash) {
      c.report.copy = prev.copy;
    }

    // first_seen_at:首次进 catalog 的时间,盖一次章、永不覆盖(驱动「新上架」榜,ADR 0016)。
    // 有 prev 就沿用旧值顶掉新候选默认的 now;存量缺 first_seen_at 的条目由
    // jobs/backfill-first-seen.ts 从 catalog git 历史一次性回填,不在采集热路径推导 git。
    if (prev) c.report.signals.first_seen_at = prev.signals.first_seen_at ?? c.report.signals.first_seen_at;

    // 归类:采集期打 meta.category + meta.tags(启发式引擎;sources.yaml 可 per-source 覆盖)。
    // 人工锁定(category_locked)的分类不被采集覆盖——与「采集不冲掉下游成果」一致。
    // uncategorized / 平票(引擎已判)保持 category="uncategorized",由分类复核挑走人工补标。
    if (prev?.meta.category_locked) {
      c.report.meta.category = prev.meta.category ?? "uncategorized";
      c.report.meta.tags = prev.meta.tags ?? [];
      c.report.meta.category_locked = true;
    } else if (prev && prev.meta.content_hash === c.report.meta.content_hash && prev.meta.category != null) {
      // 内容没变(仅上游 commit 前进等):沿用既有判定——可能是 categorize:llm 的权威结果,
      // 启发式不重判。内容真变了才走下面的启发式初判(权威判定随后由 categorize:llm 补)。
      c.report.meta.category = prev.meta.category;
      c.report.meta.tags = prev.meta.tags ?? [];
    } else {
      const { category, tags } = categorize(c.report.meta, overrideFor(c.report.meta.id));
      c.report.meta.category = category;
      c.report.meta.tags = tags;
      if (category === "uncategorized") stats.uncategorized++;
    }

    const dir = entryDir(c.report.meta.id); // catalog/skills/<owner>/<repo>/<name>
    await mkdir(dir, { recursive: true });
    const mirrorDir = join(dir, "mirror");
    if (c.mirrorSrcDir) {
      // 过滤式镜像:跳过超 MIRROR_MAX_BYTES 的文件(大 blob 不进 git);有跳过 → mirror 非完整
      const skipped = await copyMirrorFiltered(c.mirrorSrcDir, mirrorDir, MIRROR_MAX_BYTES)
        .catch((e) => { console.warn(`  ⚠ 镜像 ${c.report.meta.id} 失败(降级为索引): ${(e as Error).message}`); return null; });
      if (skipped === null) {
        // 整体失败:降级说到做到——hosting 回 indexed、清掉半拉子副本;字段永远=磁盘事实
        await rm(mirrorDir, { recursive: true, force: true }).catch(() => {});
        c.report.meta.hosting = "indexed";
        delete c.report.meta.mirror_complete;
      } else if (skipped.length) {
        c.report.meta.mirror_complete = false;
        for (const s of skipped) {
          stats.mirrorSkipped++;
          console.warn(`  ⚠ 镜像跳过大文件(不入 git)${c.report.meta.id}/${s.path} — ${(s.bytes / 1048576).toFixed(1)}MB > ${(MIRROR_MAX_BYTES / 1048576).toFixed(0)}MB`);
        }
      }
      if (skipped !== null && (await injectLicense(c, mirrorDir))) stats.licenseInjected++; // 仓级证随包
    } else {
      // 索引趟(未带 --mirror):hosting 只表达「本店实际托管」,以磁盘事实定值——
      // licence 允许(候选分类=mirrored)且磁盘已有副本 → 沿用 mirrored(完整度沿用 prev);
      // 其余一律 indexed。候选默认的 licence 分类值在此被磁盘事实覆盖,杜绝「标 mirrored 无副本」再产生。
      if (c.report.meta.hosting === "mirrored" && existsSync(mirrorDir)) {
        c.report.meta.mirror_complete = prev?.meta.mirror_complete ?? true;
        if (await injectLicense(c, mirrorDir)) stats.licenseInjected++; // 更新路径的存量镜像也补证
      } else {
        if (existsSync(mirrorDir))
          console.warn(`  ⚠ ${c.report.meta.id} licence 收紧但磁盘遗留 mirror/(hosting 置 indexed,副本去留人工核)`);
        c.report.meta.hosting = "indexed";
        delete c.report.meta.mirror_complete;
      }
    }
    // mirror 状态定妥再落 skill-report.json,确保 hosting / mirror_complete 一次写对
    await writeFile(join(dir, "skill-report.json"), JSON.stringify(c.report, null, 2) + "\n");

    written++;
    if (prev) stats.updated++;
    else stats.added++;
    if (!c.report.frontmatter_valid) stats.fmInvalid++;
    touched.push({ skill_id: c.report.meta.id, content_hash: c.report.meta.content_hash });
  }

  // 插拔点①(ADR 0012 步骤④):收录完成后异步提交判定。默认 off——
  // TRUST_SUBMIT=1 时才 submit(幂等,同 hash 同 policy 不产生新条目);
  // 服务缺席/关闭时采集完整可用,收录永不等扫描。
  if (process.env.TRUST_SUBMIT === "1" && touched.length) {
    const { submit } = await import("@skill-store/verdicts");
    let submitted = 0;
    for (const t of touched) {
      try { await submit(t); submitted++; } catch { /* 服务故障不影响采集 */ }
    }
    console.log(`verdict 提交(TRUST_SUBMIT=1): ${submitted}/${touched.length}`);
  }

  // 清单落盘(ADR 0019):采集草稿与既有记录合并——items/curator/note/blocked 是账本与人写字段,
  // 采集只刷新观测值(stars/file_count/fetched_at),不冲掉。sampled_count 权威值由货架重算(见下)。
  const changedLists = new Set<string>();
  const now = new Date().toISOString();
  for (const d of listDrafts) {
    const prev = listsMap.get(d.id);
    const next: ListReport = prev ?? {
      schema_version: "1", id: d.id, kind: "imported", url: d.url, sampled_count: d.sampled_count ?? 0, fetched_at: now,
    };
    if (d.file_count != null) next.file_count = d.file_count;
    if (d.stars_github != null) next.stars_github = d.stars_github;
    if (d.description) next.description = d.description; // 上游自述,随采集刷新(观测值,非人写字段)
    if (d.blocked) { next.blocked = true; next.block_reason ??= d.block_reason; }
    next.fetched_at = now;
    listsMap.set(d.id, next);
    changedLists.add(d.id);
  }
  // appearance 记账:引用并入来源仓清单 items(按 work+name 去重 = 幂等闸,重复观测不重复记)
  let appearNew = 0, appearKnown = 0;
  for (const a of appearanceQueue) {
    const l = listsMap.get(a.sourceRepo) ?? {
      schema_version: "1" as const, id: a.sourceRepo, kind: "imported" as const,
      url: `https://github.com/${a.sourceRepo}`, sampled_count: 0, fetched_at: now,
    };
    listsMap.set(a.sourceRepo, l);
    if (addItem(l, a.canonical, a.name)) { appearNew++; changedLists.add(a.sourceRepo); }
    else appearKnown++;
  }
  // sampled_count 对齐货架事实 + 派生信号重算(appear_count/list_count 是 items 的纯函数)
  let signalsUpdated = 0;
  if (changedLists.size) {
    const postEntries = await loadCatalogEntries();
    const liveByRepo = new Map<string, number>();
    for (const e of postEntries) {
      const r = e.report.meta.id.split("/").slice(0, 2).join("/");
      liveByRepo.set(r, (liveByRepo.get(r) ?? 0) + 1);
    }
    for (const id of changedLists) {
      const l = listsMap.get(id)!;
      if (!l.blocked) l.sampled_count = liveByRepo.get(id) ?? 0;
      await writeList(l);
    }
    const rc = await recomputeWorkSignals(listsMap, postEntries);
    signalsUpdated = rc.updated;
    for (const d of rc.dangling) console.warn(`  ⚠ 清单 ${d.list} 引用了不存在的作品 ${d.work}(悬空,待核)`);
  }

  console.log(`\n=== ingest 完成 ===`);
  console.log(`已有条目: ${existing.size} · 本次候选: ${byId.size}`);
  if (changedLists.size) console.log(`清单(catalog/lists): 更新 ${changedLists.size} 份`);
  console.log(`  新增: ${stats.added}`);
  console.log(`  更新(内容变化): ${stats.updated}`);
  console.log(`  未变跳过: ${stats.unchanged}`);
  if (stats.backfilled) console.log(`  外科式回填(context_size / upstream_commit_at / 镜像补齐,其余字段未动): ${stats.backfilled}`);
  if (stats.mirrorBackfilled) console.log(`  其中镜像补齐(--mirror 对存量落副本): ${stats.mirrorBackfilled}`);
  if (stats.licenseInjected) console.log(`  仓级证注入(mirror/LICENSE.upstream,再分发合规): ${stats.licenseInjected}`);
  if (appearNew || appearKnown) console.log(`  跨仓拷贝 → 出现记账(不落条目): 新增 ${appearNew} · 已知 ${appearKnown}`);
  if (sameRepoDup) console.log(`  同仓同内容(改名/软链,不落条目): ${sameRepoDup}`);
  if (blockedSkipped) console.log(`  已拦截仓候选出局: ${blockedSkipped}`);
  if (signalsUpdated) console.log(`  作品派生信号重算(appear_count/list_count): ${signalsUpdated}`);
  console.log(`  保留了已有审计结果: ${stats.preserved}`);
  console.log(`  frontmatter 不合规: ${stats.fmInvalid}`);
  console.log(`  待归类(uncategorized,需人工补标): ${stats.uncategorized}`);
  if (stats.mirrorSkipped) console.log(`  镜像跳过大文件(>${(MIRROR_MAX_BYTES / 1048576).toFixed(0)}MB,未入 git): ${stats.mirrorSkipped}`);
  console.log(`输出目录: ${CATALOG}`);
  await Promise.all(cleanups.map((fn) => fn().catch(() => {})));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
