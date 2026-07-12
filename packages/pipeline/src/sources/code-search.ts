/**
 * W3d:GitHub Code Search 采集器(ADR 0019 S1,第三层供给源)。
 * 专抓「好货不打标」——没打 topic、没进榜单、没被清单收录的仓,`filename:SKILL.md` 全网可见。
 * 同时是对象模型的供血线:覆盖面上去,hash 对撞才有命中,appearance 账本才开始积累。
 *
 * 配额现实(api.github.com,**必须 GITHUB_TOKEN**,code search 匿名直接 401):
 * - code search 10 req/min → 每次搜索间隔 >6s;
 * - 单查询硬上限 1000 条(10 页 × 100)→ 按 SKILL.md 文件大小(size 限定符)切片遍历;
 * - 每天扫一批攒着:游标(切片 + 页码)持久化在 catalog/_meta/code-search-state.json,
 *   随 cron 提交,跨运行续扫;扫完一轮从头再来(已知仓跳过=零成本,新增仓自然浮出);
 * - code search 只索引默认分支、fork 默认不索引(星超父仓才收),天然滤一层;文件 >384KB 不索引。
 *
 * 主循环(ADR 0019 §07):命中按仓聚合 → 已知仓/已拦截仓跳过(零克隆,配额只花在新仓)→
 * 新仓 GET /repos 拿 stars/description/archived → clone 发现 → ≥SIGNAL_ONLY 拦截只记清单 →
 * >cap 折叠采样 → 正常仓全量入候选。hash 对撞 → appearance 记账在 ingest 统一后处理(与其他源同管)。
 */
import type { SkillReport } from "@skill-store/schemas";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverFromRepo, type SkillCandidate } from "./official.ts";
import { capPerRepo, SIGNAL_ONLY, type ListDraft } from "./github-search.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const STATE_FILE = join(ROOT, "catalog", "_meta", "code-search-state.json");

const QUERY_BASE = process.env.GH_CODE_QUERY ?? "filename:SKILL.md";
const TOKEN = process.env.GITHUB_TOKEN;
/** 单次运行的搜索请求预算(10 req/min → 默认 30 次 ≈ 3 分钟);env CODE_SEARCH_CALLS 覆盖 */
const MAX_CALLS = Number(process.env.CODE_SEARCH_CALLS) || 30;
/** 搜索请求间隔:code search 限流 10/min,留余量 */
const SEARCH_INTERVAL_MS = 6500;

/**
 * size 切片表(字节):每片期望 <1000 条以绕单查询上限。SKILL.md 主流 0.5~10KB,
 * 低段切细、高段放粗;末片开区间。分布漂移时调表即可,游标按片索引存,表变更后建议清游标重扫。
 */
const SLICES: ReadonlyArray<readonly [number, number | null]> = [
  [0, 300], [300, 500], [500, 700], [700, 900], [900, 1100], [1100, 1300], [1300, 1500],
  [1500, 1800], [1800, 2100], [2100, 2500], [2500, 3000], [3000, 3500], [3500, 4000],
  [4000, 5000], [5000, 6000], [6000, 8000], [8000, 10000], [10000, 15000], [15000, 25000],
  [25000, 50000], [50000, 100000], [100000, null],
];

interface SweepState {
  slice: number;
  page: number;
  /** 每片 total_count 快照(最近一次观测):Σ ≈ 全网 SKILL.md 规模,收录页「全网观测」的数据源 */
  totals: Record<string, number>;
  sweeps_completed: number;
  updated_at: string;
}

const sliceKey = (s: readonly [number, number | null]) => (s[1] == null ? `${s[0]}..` : `${s[0]}..${s[1]}`);
const sliceQualifier = (s: readonly [number, number | null]) => (s[1] == null ? `size:>=${s[0]}` : `size:${s[0]}..${s[1]}`);

async function loadState(): Promise<SweepState> {
  try { return JSON.parse(await readFile(STATE_FILE, "utf8")) as SweepState; }
  catch { return { slice: 0, page: 1, totals: {}, sweeps_completed: 0, updated_at: "" }; }
}

async function saveState(s: SweepState): Promise<void> {
  s.updated_at = new Date().toISOString();
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(s, null, 2) + "\n");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ghJson<T>(url: string): Promise<{ status: number; data: T | null }> {
  const res = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "oh-my-skill-ingest",
      authorization: `Bearer ${TOKEN}`,
    },
  });
  if (!res.ok) return { status: res.status, data: null };
  return { status: res.status, data: (await res.json()) as T };
}

interface CodeSearchPage {
  total_count: number;
  items: { repository: { full_name: string; fork: boolean } }[];
}

interface RepoMeta { stargazers_count: number; description: string | null; archived: boolean; fork: boolean }

/**
 * 全网扫描:攒新仓直到 maxNewRepos 或搜索预算耗尽。
 * knownRepos / blockedIds 均为小写 owner/repo 集合;已知即跳,配额只花在增量上。
 */
export async function discoverFromCodeSearch(
  maxNewRepos: number,
  blockedIds: Set<string>,
  knownRepos: Set<string>,
): Promise<{ candidates: SkillCandidate[]; lists: ListDraft[]; cleanup: () => Promise<void> }> {
  if (!TOKEN) throw new Error("Code Search 需要 GITHUB_TOKEN(code search API 匿名 401)");
  const state = await loadState();
  const maxPerRepo = Number(process.env.MAX_PER_REPO) || 50;
  console.log(`  游标:切片 ${state.slice}/${SLICES.length}(${sliceKey(SLICES[state.slice])})页 ${state.page} · 已完整扫过 ${state.sweeps_completed} 轮`);
  console.log(`  预算:搜索 ${MAX_CALLS} 次 · 新仓上限 ${maxNewRepos} · 每仓上限 ${maxPerRepo} · 拦截阈值 ${SIGNAL_ONLY}`);

  // ── 第一段:花搜索配额,攒新仓 slug ──
  const fresh = new Map<string, true>(); // 本次发现的新仓(保持发现顺序)
  let calls = 0, seenHits = 0, skippedKnown = 0;
  while (calls < MAX_CALLS && fresh.size < maxNewRepos) {
    const slice = SLICES[state.slice];
    const q = encodeURIComponent(`${QUERY_BASE} ${sliceQualifier(slice)}`);
    if (calls > 0) await sleep(SEARCH_INTERVAL_MS);
    const { status, data } = await ghJson<CodeSearchPage>(
      `https://api.github.com/search/code?q=${q}&per_page=100&page=${state.page}`,
    );
    calls++;
    if (status === 403 || status === 429) { // 二级限流:退避后本轮直接收工,游标原地保留
      console.warn(`  ⚠ 限流(${status}),本轮收工(游标保留在 切片${state.slice} 页${state.page})`);
      break;
    }
    if (!data) { console.warn(`  ✗ code search ${status} @ 切片${state.slice} 页${state.page},跳到下一片`); state.slice = (state.slice + 1) % SLICES.length; state.page = 1; if (state.slice === 0) state.sweeps_completed++; continue; }
    state.totals[sliceKey(slice)] = data.total_count;
    seenHits += data.items.length;
    for (const it of data.items) {
      const slug = it.repository.full_name.toLowerCase();
      if (it.repository.fork || knownRepos.has(slug) || blockedIds.has(slug) || fresh.has(slug)) { skippedKnown++; continue; }
      fresh.set(slug, true);
      if (fresh.size >= maxNewRepos) break;
    }
    // 推进游标:页尽或片尽(1000 条硬上限 = 最多 10 页)
    const exhausted = data.items.length < 100 || state.page >= 10;
    if (exhausted) { state.slice = (state.slice + 1) % SLICES.length; state.page = 1; if (state.slice === 0) state.sweeps_completed++; }
    else state.page++;
  }
  const universe = Object.values(state.totals).reduce((a, b) => a + b, 0);
  console.log(`  搜索 ${calls} 次 · 命中 ${seenHits} 条 · 已知/重复跳过 ${skippedKnown} · 新仓 ${fresh.size} · 全网观测累计 ${universe.toLocaleString()}`);
  await saveState(state); // 游标先落盘:后续克隆再慢再挂,扫描进度不回退

  // ── 第二段:新仓逐个走三档处置(与 github-search 同款) ──
  const out: SkillCandidate[] = [];
  const lists: ListDraft[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const slug of fresh.keys()) {
    const { data: meta } = await ghJson<RepoMeta>(`https://api.github.com/repos/${slug}`);
    if (!meta || meta.archived || meta.fork) continue;
    const [owner, repoName] = slug.split("/");
    const listId = `${owner}/${repoName}`; // slug 已小写
    const url = `https://github.com/${slug}`;
    try {
      const { candidates, cleanup } = await discoverFromRepo(slug);
      cleanups.push(cleanup);
      if (candidates.length >= SIGNAL_ONLY) {
        lists.push({ id: listId, url, stars_github: meta.stargazers_count, description: meta.description,
          file_count: candidates.length, blocked: true, block_reason: `bulk>=${SIGNAL_ONLY}` });
        console.log(`    ${slug}: ${candidates.length} skill ≥ ${SIGNAL_ONLY} → 只记清单(★${meta.stargazers_count})`);
        continue;
      }
      const kept = capPerRepo(candidates, maxPerRepo);
      for (const c of kept) {
        (c.report as SkillReport).signals.stars_github = meta.stargazers_count;
        out.push(c);
      }
      if (kept.length < candidates.length) {
        lists.push({ id: listId, url, stars_github: meta.stargazers_count, description: meta.description,
          file_count: candidates.length, sampled_count: kept.length });
        console.log(`    ${slug}: ${candidates.length} skill → 折叠采样 ${kept.length}(★${meta.stargazers_count})`);
      } else if (candidates.length) {
        console.log(`    ${slug}: ${candidates.length} skill(★${meta.stargazers_count})`);
      }
    } catch (e) {
      console.warn(`  ✗ ${slug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, lists, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
