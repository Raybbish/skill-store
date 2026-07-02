/**
 * ingest:读 sources.yaml → 逐源发现 skill → 哈希去重 → 写 catalog/
 * 用法:npm run ingest [-- --limit 20] [-- --source anthropics/skills]
 */
import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "../sources/official.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG = join(ROOT, "catalog", "skills");

/** 加载 catalog 已有条目:id → 报告(用于跨运行去重 + 保留审计/评测/人工结果) */
async function loadExisting(): Promise<Map<string, SkillReport>> {
  const out = new Map<string, SkillReport>();
  let owners: string[] = [];
  try { owners = await readdir(CATALOG); } catch { return out; }
  for (const owner of owners) {
    let names: string[] = [];
    try { names = await readdir(join(CATALOG, owner)); } catch { continue; }
    for (const name of names) {
      try {
        const r = JSON.parse(await readFile(join(CATALOG, owner, name, "skill-report.json"), "utf8")) as SkillReport;
        out.set(r.meta.id, r);
      } catch { /* 非条目目录,跳过 */ }
    }
  }
  return out;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const limit = arg("limit") ? Number(arg("limit")) : Infinity;
  const onlySource = arg("source");

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
  if (process.argv.includes("--github-search")) {
    const n = Number(arg("github-search")) || 100;
    console.log(`\n▶ 采集 GitHub 全域头部 ${n} 个仓库 …`);
    const { discoverFromGitHub } = await import("../sources/github-search.ts");
    const { candidates, cleanup } = await discoverFromGitHub(n);
    cleanups.push(cleanup);
    console.log(`  发现 ${candidates.length} 个 skill`);
    all.push(...candidates);
  }

  // skills.sh 私有 registry(--skills-sh [N]);endpoint 未公开文档化,需自行确认 SKILLS_SH_REGISTRY
  if (process.argv.includes("--skills-sh")) {
    const n = Number(arg("skills-sh")) || 200;
    console.log(`\n▶ 采集 skills.sh 头部 ${n} 条 …`);
    const { discoverFromSkillsSh } = await import("../sources/skills-sh.ts");
    const { candidates, cleanup } = await discoverFromSkillsSh(n);
    cleanups.push(cleanup);
    console.log(`  发现 ${candidates.length} 个 skill`);
    all.push(...candidates);
  }

  // 跨运行 + 跨源哈希去重:先用已有 catalog 预填 byHash,新采集与历史一起比对
  const existing = await loadExisting();
  const byHash = new Map<string, string>();
  for (const r of existing.values()) byHash.set(r.meta.content_hash, r.meta.id);
  for (const c of all) {
    const h = c.report.meta.content_hash;
    const seen = byHash.get(h);
    // 已存在同哈希且不是自己(同 id 覆盖更新不算重复)→ 标 duplicate_of
    if (seen && seen !== c.report.meta.id) c.report.meta.duplicate_of = seen;
    else if (!seen) byHash.set(h, c.report.meta.id);
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

    const [owner, name] = c.report.meta.id.split("/");
    const dir = join(CATALOG, owner, name);
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

  console.log(`\n=== ingest 完成 ===`);
  console.log(`已有条目: ${existing.size} · 本次候选: ${byId.size}`);
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
