/**
 * ingest:读 sources.yaml → 逐源发现 skill → 哈希去重 → 写 catalog/
 * 用法:npm run ingest [-- --limit 20] [-- --source anthropics/skills]
 */
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { discoverFromRepo, type SkillCandidate } from "../sources/official.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG = join(ROOT, "catalog", "skills");

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

  // 跨源哈希去重:同 content_hash 保留先到者,后到者标 duplicate_of
  const byHash = new Map<string, string>();
  for (const c of all) {
    const h = c.report.meta.content_hash;
    const seen = byHash.get(h);
    if (seen) c.report.meta.duplicate_of = seen;
    else byHash.set(h, c.report.meta.id);
  }

  let written = 0;
  const stats = { mirrored: 0, indexed: 0, dup: 0, fmInvalid: 0 };
  for (const c of all.slice(0, limit)) {
    const [owner, name] = c.report.meta.id.split("/");
    const dir = join(CATALOG, owner, name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "skill-report.json"), JSON.stringify(c.report, null, 2) + "\n");
    if (c.mirrorSrcDir) {
      await cp(c.mirrorSrcDir, join(dir, "mirror"), { recursive: true });
    }
    written++;
    if (c.report.meta.duplicate_of) stats.dup++;
    else if (c.report.meta.hosting === "mirrored") stats.mirrored++;
    else stats.indexed++;
    if (!c.report.frontmatter_valid) stats.fmInvalid++;
  }

  console.log(`\n=== ingest 完成 ===`);
  console.log(`写入条目: ${written}`);
  console.log(`  托管型(mirrored): ${stats.mirrored}`);
  console.log(`  索引型(indexed): ${stats.indexed}`);
  console.log(`  重复(duplicate): ${stats.dup}`);
  console.log(`  frontmatter 不合规: ${stats.fmInvalid}`);
  console.log(`输出目录: ${CATALOG}`);
  await Promise.all(cleanups.map((fn) => fn().catch(() => {})));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
