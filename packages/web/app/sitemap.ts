import type { MetadataRoute } from "next";
import { allSkills } from "@/lib/data";
import { readIdxPacks } from "@/lib/store-server";
import { listPublishers } from "@/lib/publishers";
import { featuredLabels } from "@skill-store/schemas";

/** 静态导出:构建时生成单个 sitemap.xml(约 1w URL,远低于 5w 上限)。
 *  只列可见条目 —— 退市墓碑页保留深链可达,但不主动推给爬虫。 */
const HOST = "https://oh-my-skill.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = [
    "", "en/",
    "charts/", "en/charts/",
    "talk/", "en/talk/",
    "changelog/", "en/changelog/",
    "methodology/", "en/methodology/",
    "privacy/",
  ].map((p) => ({ url: `${HOST}/${p}` }));

  const packs = readIdxPacks().flatMap((p) => [
    { url: `${HOST}/pack/${p.id}/` },
    { url: `${HOST}/en/pack/${p.id}/` },
  ]);

  const cats = featuredLabels().map((l) => ({ url: `${HOST}/category/${l.slug}/` }));

  const skills = allSkills().map((s) => ({
    url: `${HOST}/skill/${s.owner}/${s.repo}/${s.name}/`,
  }));

  const pubs = listPublishers().map((dev) => ({ url: `${HOST}/publisher/${encodeURIComponent(dev)}/` }));

  return [...statics, ...packs, ...cats, ...skills, ...pubs];
}
