/**
 * ingest:读 sources.yaml → 逐源发现 skill → 哈希去重 → 写 catalog/
 * 用法:npm run ingest [-- --limit 20] [-- --source anthropics/skills]
 */
import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { CollectionReport, SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "../sources/official.ts";
import { CATALOG, loadCatalogEntries, entryDir } from "../catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const COLLECTIONS = join(ROOT, "catalog", "collections");

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
    sources: { type: string; repo: string }[];
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
  const stats = { added: 0, updated: 0, unchanged: 0, dup: 0, preserved: 0, fmInvalid: 0 };
  for (const c of byId.values()) {
    const prev = existing.get(c.report.meta.id);

    // 内容与上游 commit 都没变 → 跳过,连文件都不重写(幂等,不产生噪音 diff)
    if (prev && prev.meta.content_hash === c.report.meta.content_hash &&
        prev.meta.upstream_commit === c.report.meta.upstream_commit) {
      stats.unchanged++;
      continue;
    }

    // 同 id 更新:保留已有的审计/评测/人工复核结果(采集只负责元数据,不冲掉下游成果)
    if (prev) {
      const psa = prev.security_audit as SkillReport["security_audit"] & { review?: unknown; l3?: unknown };
      if (psa.review || psa.status !== "pending") {
        // 上游内容变了才需重审;这里保留旧审计,由 audit 的哈希漂移检测触发重审
        c.report.security_audit = prev.security_audit;
        stats.preserved++;
      }
      if (prev.eval) (c.report as SkillReport & { eval: unknown }).eval = prev.eval;
    }

    const dir = entryDir(c.report.meta.id); // catalog/skills/<owner>/<repo>/<name>
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "skill-report.json"), JSON.stringify(c.report, null, 2) + "\n");
    if (c.mirrorSrcDir) {
      // force 覆盖已存在;dereference 把源里的 symlink 落成真实文件(合集仓常用软链共享)
      await cp(c.mirrorSrcDir, join(dir, "mirror"), { recursive: true, force: true, dereference: true })
        .catch((e) => console.warn(`  ⚠ 镜像 ${c.report.meta.id} 失败(降级为索引): ${(e as Error).message}`));
    }

    written++;
    if (c.report.meta.duplicate_of) stats.dup++;
    else if (prev) stats.updated++;
    else stats.added++;
    if (!c.report.frontmatter_valid) stats.fmInvalid++;
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
  console.log(`  重复(标记 duplicate_of): ${stats.dup}`);
  console.log(`  保留了已有审计结果: ${stats.preserved}`);
  console.log(`  frontmatter 不合规: ${stats.fmInvalid}`);
  console.log(`输出目录: ${CATALOG}`);
  await Promise.all(cleanups.map((fn) => fn().catch(() => {})));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
