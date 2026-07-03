/**
 * W3c:skills.sh 采集器。解析首页 SSR 榜单(按安装量排序,服务端渲染全量输出,
 * robots.txt 明确 Allow /,~280 条足够 top-200 信号),取每条的上游 GitHub 仓库,
 * 复用 official 的 clone 逻辑采集内容,并注入 installs 信号。
 *
 * 设计:skills.sh 只作供给「发现」信号,内容一律回上游 GitHub 采集(不镜像它的数据库)。
 * 注:官方 /api/v1 文档声称免鉴权,实测 401 需申请 key,故不对接;页面结构变化会导致
 * 解析 0 条报错,届时更新正则即可。
 * 注:skills.sh 域名需公网可达——在本机或 CI 运行(采集沙箱通常只放行 github.com)。
 */
import type { SkillReport } from "@skill-store/schemas";
import { normalizeName } from "../frontmatter.ts";
import { discoverFromRepo, type SkillCandidate } from "./official.ts";

const SITE = "https://www.skills.sh/";

export interface RegistryEntry {
  repoSlug: string;    // owner/repo
  slug: string;        // skill 目录/名称 slug
  installs: number | null;
}

/** 解析首页 SSR 榜单。链接形如 /<owner>/<repo>/<slug>,锚文本尾部带安装量(2.3M/613.6K) */
export async function fetchTop(limit: number): Promise<RegistryEntry[]> {
  const res = await fetch(SITE, {
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 (compatible; skill-store-ingest)" },
  });
  if (!res.ok) throw new Error(`skills.sh 榜单页 ${res.status}(需公网可达,建议本机/CI 运行)`);
  const html = await res.text();

  const NAV = new Set(["site", "topic", "agent", "agents", "docs"]); // site/* 为 well-known 非 GitHub 源
  const UNIT: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
  const out: RegistryEntry[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]+href="(?:https?:\/\/(?:www\.)?skills\.sh)?\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(re)) {
    const [, owner, repo, slug, inner] = m;
    if (NAV.has(owner.toLowerCase())) continue;
    const key = `${owner}/${repo}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cm = inner.replace(/<[^>]+>/g, " ").match(/([\d][\d.,]*)\s*([KMB])?\s*$/);
    const installs = cm ? Math.round(parseFloat(cm[1].replace(/,/g, "")) * (UNIT[cm[2] ?? ""] ?? 1)) : null;
    out.push({ repoSlug: `${owner}/${repo}`, slug, installs });
    if (out.length >= limit) break;
  }
  if (!out.length) throw new Error("SSR 榜单解析到 0 条(页面结构可能已变,需更新解析规则)");
  return out;
}

/** 采集 skills.sh 头部榜单:按上游仓分组 clone,slug 匹配对应 skill,注入 installs */
export async function discoverFromSkillsSh(limit = 200): Promise<{ candidates: SkillCandidate[]; cleanup: () => Promise<void> }> {
  const entries = await fetchTop(limit);
  // 同一仓库只 clone 一次
  const byRepo = new Map<string, RegistryEntry[]>();
  for (const e of entries) (byRepo.get(e.repoSlug) ?? byRepo.set(e.repoSlug, []).get(e.repoSlug)!).push(e);
  console.log(`  榜单命中 ${entries.length} 条,涉及 ${byRepo.size} 个上游仓`);

  const out: SkillCandidate[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const [repoSlug, group] of byRepo) {
    try {
      const { candidates, cleanup } = await discoverFromRepo(repoSlug);
      cleanups.push(cleanup);
      const installBySlug = new Map(group.map((g) => [g.slug, g.installs]));
      for (const c of candidates) {
        // slug 匹配:优先 skill 目录名,其次规范化后的 name(两者都是 skills.sh slug 的常见来源)
        const dirBase = c.report.meta.upstream.match(/\/tree\/[^/]+\/.*?([^/]+)\/?$/)?.[1] ?? "";
        const key = installBySlug.has(dirBase) ? dirBase
          : installBySlug.has(normalizeName(c.report.meta.name)) ? normalizeName(c.report.meta.name)
          : null;
        if (key === null) continue; // 仓库里榜单未命中的其他 skill 不从此源收(由 github-search 等覆盖)
        (c.report as SkillReport).signals.installs_skills_sh = installBySlug.get(key) ?? null;
        out.push(c);
      }
    } catch (e) {
      console.warn(`  ✗ skills.sh 仓 ${repoSlug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
