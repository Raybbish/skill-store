/**
 * 清单描述回填:补齐 catalog/lists 缺失的上游仓自述(GitHub repo description)。
 * 自述是采集事实非本店转述,收录页直接展示;此后每日 ingest 的搜索趟会自然刷新,
 * 本 job 只为存量一次性补齐(以及被搜索长尾漏掉的仓)。
 *
 * 用法:npm run backfill:list-desc [-- --apply] [--all](--all 连已有描述的也刷新)
 * 需 api.github.com 可达(本机/CI,GITHUB_TOKEN 提升限流:无 token 60 次/时不够 120 仓)。
 */
import { loadLists, writeList } from "../lists.ts";

const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");
const TOKEN = process.env.GITHUB_TOKEN;

async function fetchRepo(slug: string): Promise<{ description: string | null; stars: number } | null> {
  const res = await fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "oh-my-skill-ingest",
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (res.status === 404) return null; // 上游已删/改名:留待退市机制(STATUS 待办),不在此处置
  if (!res.ok) throw new Error(`GitHub ${res.status} @ ${slug}`);
  const d = (await res.json()) as { description: string | null; stargazers_count: number };
  return { description: d.description, stars: d.stargazers_count };
}

async function main() {
  const lists = await loadLists();
  const targets = [...lists.values()].filter((l) => ALL || !l.description);
  console.log(`清单 ${lists.size} 份,待补描述 ${targets.length}(${APPLY ? "APPLY" : "dry-run"})`);
  let filled = 0, empty = 0, gone = 0;
  for (const l of targets) {
    try {
      const r = await fetchRepo(l.id);
      if (!r) { gone++; console.warn(`  ⚠ ${l.id} 上游 404(删/改名,待退市机制)`); continue; }
      if (r.description) {
        l.description = r.description;
        l.stars_github = r.stars;
        filled++;
        console.log(`  ${l.id}: ${r.description.slice(0, 60)}`);
        if (APPLY) await writeList(l);
      } else empty++; // 上游本来就没写自述,不硬造
    } catch (e) {
      console.warn(`  ✗ ${(e as Error).message}`);
    }
  }
  console.log(`\n补齐 ${filled} · 上游无自述 ${empty} · 上游 404 ${gone}${APPLY ? "" : " · dry-run 未写盘,加 --apply 执行"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
