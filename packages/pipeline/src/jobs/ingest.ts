/**
 * ingest:读 sources.yaml → 逐源发现 skill → 哈希去重 → 写 catalog/
 * 用法:npm run ingest [-- --limit 20] [-- --source anthropics/skills]
 */
import { mkdir, readFile, writeFile, readdir, stat, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { CollectionReport, SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "../sources/official.ts";
import { CATALOG, loadCatalogEntries, entryDir } from "../catalog.ts";
import { CONTEXT_SIZE_COUNTER_ID } from "../context-size.ts";
import { categorize } from "../categorize.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const COLLECTIONS = join(ROOT, "catalog", "collections");

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
  // 批量源仓库(skill 数 > MAX_PER_REPO)折叠采样,额外产出仓库级合集条目
  const collections: CollectionReport[] = [];
  if (process.argv.includes("--github-search")) {
    const n = Number(arg("github-search")) || 100;
    console.log(`\n▶ 采集 GitHub 全域头部 ${n} 个仓库 …`);
    const { discoverFromGitHub } = await import("../sources/github-search.ts");
    const { candidates, collections: cols, cleanup } = await discoverFromGitHub(n);
    cleanups.push(cleanup);
    collections.push(...cols);
    console.log(`  发现 ${candidates.length} 个 skill,${cols.length} 个批量源合集`);
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
  for (const [h, group] of byHashGroups) {
    let canonical = byHash.get(h);
    if (!canonical) {
      let best = group[0];
      for (const c of group) if (canonRank(c) > canonRank(best)) best = c;
      canonical = best.report.meta.id;
      byHash.set(h, canonical);
    }
    // 同 id 覆盖更新不算重复
    for (const c of group) if (c.report.meta.id !== canonical) c.report.meta.duplicate_of = canonical;
  }

  // 同 id 去重:一次运行内同 id 只保留第一条(避免同一 skill 被多源重复写)
  const byId = new Map<string, SkillCandidate>();
  for (const c of all.slice(0, limit)) if (!byId.has(c.report.meta.id)) byId.set(c.report.meta.id, c);

  let written = 0;
  const stats = { added: 0, updated: 0, unchanged: 0, backfilled: 0, dup: 0, preserved: 0, fmInvalid: 0, uncategorized: 0, mirrorSkipped: 0 };
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
      if ((prev.context_size == null || prev.context_size.counter.id !== CONTEXT_SIZE_COUNTER_ID) &&
          c.report.context_size != null) {
        prev.context_size = c.report.context_size;
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
    if (c.mirrorSrcDir) {
      // 过滤式镜像:跳过超 MIRROR_MAX_BYTES 的文件(大 blob 不进 git);有跳过或整体失败 → mirror 非完整
      const skipped = await copyMirrorFiltered(c.mirrorSrcDir, join(dir, "mirror"), MIRROR_MAX_BYTES)
        .catch((e) => { console.warn(`  ⚠ 镜像 ${c.report.meta.id} 失败(降级为索引): ${(e as Error).message}`); return null; });
      if (skipped === null || skipped.length) {
        c.report.meta.mirror_complete = false;
        for (const s of skipped ?? []) {
          stats.mirrorSkipped++;
          console.warn(`  ⚠ 镜像跳过大文件(不入 git)${c.report.meta.id}/${s.path} — ${(s.bytes / 1048576).toFixed(1)}MB > ${(MIRROR_MAX_BYTES / 1048576).toFixed(0)}MB`);
        }
      }
    }
    // mirror 写完再落 skill-report.json,确保 mirror_complete 一次写对
    await writeFile(join(dir, "skill-report.json"), JSON.stringify(c.report, null, 2) + "\n");

    written++;
    if (c.report.meta.duplicate_of) stats.dup++;
    else if (prev) stats.updated++;
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

  // 批量源合集条目:catalog/collections/<owner>/<repo>.json;字段没变就不重写(幂等)
  let colWritten = 0;
  for (const col of collections) {
    const [owner, repo] = col.id.split("/");
    const file = join(COLLECTIONS, owner, `${repo}.json`);
    try {
      const prev = JSON.parse(await readFile(file, "utf8")) as CollectionReport;
      if (prev.skill_count === col.skill_count && prev.sampled_count === col.sampled_count &&
          prev.stars_github === col.stars_github) continue;
    } catch { /* 不存在或损坏 → 写入 */ }
    await mkdir(join(COLLECTIONS, owner), { recursive: true });
    await writeFile(file, JSON.stringify(col, null, 2) + "\n");
    colWritten++;
  }

  console.log(`\n=== ingest 完成 ===`);
  console.log(`已有条目: ${existing.size} · 本次候选: ${byId.size}`);
  if (collections.length) console.log(`批量源合集: ${collections.length}(写入/更新 ${colWritten})`);
  console.log(`  新增: ${stats.added}`);
  console.log(`  更新(内容变化): ${stats.updated}`);
  console.log(`  未变跳过: ${stats.unchanged}`);
  if (stats.backfilled) console.log(`  外科式回填/升级 context_size(其余字段未动): ${stats.backfilled}`);
  console.log(`  重复(标记 duplicate_of): ${stats.dup}`);
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
