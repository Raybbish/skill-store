/**
 * enrich-stars:给 catalog 每条补 GitHub stars(signals.stars_github)。
 *
 * clone 采集的条目 stars 为 null(official.ts 设 null);这里从 meta.upstream 解析 owner/repo,
 * 用 GitHub API(github.ts)查 stars 写回。要点:
 *   - 按 repo 去重:多个 skill 共用一仓,只查一次(73 条 → 十几个唯一仓)
 *   - 新鲜度截止线:state 文件记 { repo: { stars, at } },CUTOFF 天内不重复打 API
 *   - fail-soft:单仓失败(404/限流)不阻断,退回旧值、继续
 *   - 幂等:仅当 stars 变化才重写 skill-report.json(不产生噪音 diff)
 *
 * 环境:建议 GITHUB_TOKEN(否则 60 次/小时)。采集沙箱通常不放行 api.github.com,故在 CI / 本机跑。
 * 用法:npm run enrich:stars [-- --force] [-- --max 50]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getRepo } from "../github.ts";
import { loadCatalogEntries, ROOT } from "../catalog.ts";
import { markMissing } from "../delist.ts";

const STATE = join(ROOT, "catalog", "_meta", "stars-state.json");
const CUTOFF_DAYS = 7;

/** 从 upstream URL 解析 owner/repo;非 github 返回 null */
function repoOf(upstream: string): string | null {
  const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(upstream);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

type State = Record<string, { stars: number; at: string }>;

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.warn("⚠ 未设 GITHUB_TOKEN:GitHub API 限 60 次/小时。建议在 CI 带 token 跑。");
  }
  const force = process.argv.includes("--force");
  const max = arg("max") ? Number(arg("max")) : Infinity;

  const entries = await loadCatalogEntries();

  let state: State = {};
  if (existsSync(STATE)) {
    try { state = JSON.parse(await readFile(STATE, "utf8")) as State; } catch { /* 损坏则重建 */ }
  }

  // 唯一 GitHub 仓
  const repos = new Set<string>();
  const noRepo: string[] = [];
  for (const e of entries) {
    const r = repoOf(e.report.meta.upstream);
    if (r) repos.add(r); else noRepo.push(e.report.meta.id);
  }

  const cutoff = Date.now() - CUTOFF_DAYS * 864e5;
  const stars = new Map<string, number>(); // repo → 本次可用 stars
  const goneRepos = new Set<string>();     // API 404 = 上游删除/改私有(ADR 0020 仓级缺席)
  let fetched = 0, cached = 0, failed = 0;
  for (const repo of repos) {
    const st = state[repo];
    const fresh = st && new Date(st.at).getTime() > cutoff;
    if (!force && fresh) { stars.set(repo, st.stars); cached++; continue; }
    if (fetched >= max) { if (st) stars.set(repo, st.stars); continue; }
    try {
      const info = await getRepo(repo);
      stars.set(repo, info.stargazers_count);
      state[repo] = { stars: info.stargazers_count, at: new Date().toISOString() };
      fetched++;
      console.log(`  ★ ${repo}: ${info.stargazers_count}`);
    } catch (err) {
      const msg = (err as Error).message;
      failed++;
      if (st) stars.set(repo, st.stars); // 退回旧值,不清空
      if (/API 404/.test(msg)) goneRepos.add(repo); // 仅明确 404 计缺席;限流/网络失败不计
      console.warn(`  ⚠ ${repo}: ${msg}`);
    }
  }

  // 仓级缺席(ADR 0020):404 仓的全部条目计缺席,与 ingest 共用 helper 与同日幂等闸,
  // 连续 ≥ DELIST_STREAK 个观测日 → 退市墓碑。本 job 每日 cron 跑,
  // 长尾仓(搜索采样源此后不再回访)的死亡由这条线兜住。
  let missedN = 0, tombedN = 0;
  for (const e of entries) {
    const r = repoOf(e.report.meta.upstream);
    if (!r || !goneRepos.has(r)) continue;
    const res = markMissing(e.report);
    if (res === "noop") continue;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    missedN++;
    if (res === "delisted") {
      tombedN++;
      console.warn(`  ⚠ 退市: ${e.report.meta.id}(仓 404,连续缺席 ${e.report.signals.missing_streak} 个观测日)`);
    }
  }
  if (missedN) console.log(`  上游 404 → 缺席计数 ${missedN} 条${tombedN ? `,其中退市 ${tombedN}` : ""}`);

  // 写回(仅值变化)
  let written = 0;
  for (const e of entries) {
    const r = repoOf(e.report.meta.upstream);
    if (!r || !stars.has(r)) continue;
    const v = stars.get(r)!;
    if (e.report.signals.stars_github === v) continue;
    e.report.signals.stars_github = v;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    written++;
  }

  await mkdir(join(ROOT, "catalog", "_meta"), { recursive: true });
  await writeFile(STATE, JSON.stringify(state, null, 2) + "\n");

  console.log(`\nenrich-stars: 拉取 ${fetched} 仓 · 缓存命中 ${cached} · 失败 ${failed} · 写回 ${written} 条`);
  if (noRepo.length) console.log(`  非 GitHub upstream(不补 stars): ${noRepo.length} 条`);
}

main().catch((e) => { console.error(e); process.exit(1); });
