/**
 * 热门集合(ADR 0025 分层推进的 S1「热门先行」选集)。
 * hot = 场景包成员(货架明面上的 featured,必进)∪ 人气 top N。
 * 人气排序与 web 的 byPopularity 同思路:installs(skills.sh 实装,最强使用信号)为主键,
 * 归一 stars(stars/√repo_skill_count,抑制巨仓)为次键。
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, type CatalogEntry } from "./catalog.ts";

/** 场景包成员 id 全集(catalog/packs/*.json 的 skills 数组) */
export async function packMemberIds(): Promise<Set<string>> {
  const out = new Set<string>();
  const dir = join(ROOT, "catalog", "packs");
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch {
    return out;
  }
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const p = JSON.parse(await readFile(join(dir, f), "utf8")) as { skills?: string[] };
      for (const id of p.skills ?? []) out.add(id.toLowerCase());
    } catch {
      /* 坏包文件跳过 */
    }
  }
  return out;
}

function popScore(e: CatalogEntry): [number, number] {
  const s = e.report.signals;
  const norm = (s.stars_github ?? 0) / Math.sqrt(Math.max(1, s.repo_skill_count ?? 1));
  return [s.installs_skills_sh ?? 0, norm];
}

/** 热门 id 集:场景包成员 ∪ 人气 top N(entries 应已按调用方口径预过滤) */
export async function hotIds(entries: CatalogEntry[], top: number): Promise<Set<string>> {
  const out = await packMemberIds();
  const ranked = [...entries].sort((a, b) => {
    const [ai, an] = popScore(a);
    const [bi, bn] = popScore(b);
    return bi - ai || bn - an;
  });
  for (const e of ranked.slice(0, top)) out.add(e.report.meta.id);
  return out;
}
