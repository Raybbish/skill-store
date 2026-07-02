/**
 * W3c:skills.sh 采集器。从 skills.sh registry 拉「头部榜单」(按安装量排序),
 * 取每条的上游 GitHub 仓库,复用 official 的 clone 逻辑采集内容,并注入 installs 信号。
 *
 * 设计:skills.sh 只作供给「发现」信号,内容一律回上游 GitHub 采集(不镜像它的数据库)。
 * 环境:SKILLS_SH_REGISTRY 可覆盖 registry endpoint。
 * 注:skills.sh 域名需公网可达——在本机或 CI 运行(采集沙箱通常只放行 github.com)。
 */
import type { SkillReport } from "@skill-store/schemas";
import { discoverFromRepo, type SkillCandidate } from "./official.ts";

const REGISTRY = process.env.SKILLS_SH_REGISTRY ?? "https://skills.sh/api/registry";

interface RegistryEntry {
  repoSlug: string;   // owner/repo
  subpath: string;    // 仓库内 skill 目录(可能为 "")
  installs: number | null;
}

/** 容错解析:registry 各版本字段名不一,尽量从 source/repo/url 提取 owner/repo + path */
function normalize(raw: unknown): RegistryEntry | null {
  const o = raw as Record<string, unknown>;
  const source = String(o.source ?? o.repo ?? o.repository ?? o.url ?? o.github ?? "");
  const m = source.match(/github\.com[:/]([^/]+\/[^/#?]+?)(?:\.git)?(?:\/tree\/[^/]+\/(.*))?$/i);
  if (!m) return null;
  const installs = Number(o.installs ?? o.install_count ?? o.downloads ?? NaN);
  return {
    repoSlug: m[1],
    subpath: (m[2] ?? String(o.path ?? "")).replace(/^\/|\/$/g, ""),
    installs: Number.isFinite(installs) ? installs : null,
  };
}

/** 拉 registry 头部 N 条,归一为上游仓库清单 */
export async function fetchTop(limit: number): Promise<RegistryEntry[]> {
  const res = await fetch(`${REGISTRY}?sort=installs&limit=${limit}`, {
    headers: { accept: "application/json", "user-agent": "oh-my-skill-ingest" },
  });
  if (!res.ok) throw new Error(`skills.sh registry ${res.status}(域名需公网可达,建议本机/CI 运行)`);
  const data = (await res.json()) as unknown;
  const rows = Array.isArray(data) ? data : ((data as Record<string, unknown>).skills as unknown[]) ?? [];
  return rows.map(normalize).filter((x): x is RegistryEntry => x !== null);
}

/** 采集 skills.sh 头部榜单:按上游仓分组 clone,过滤到对应 subpath,注入 installs */
export async function discoverFromSkillsSh(limit = 200): Promise<{ candidates: SkillCandidate[]; cleanup: () => Promise<void> }> {
  const entries = await fetchTop(limit);
  // 同一仓库只 clone 一次
  const byRepo = new Map<string, RegistryEntry[]>();
  for (const e of entries) (byRepo.get(e.repoSlug) ?? byRepo.set(e.repoSlug, []).get(e.repoSlug)!).push(e);

  const out: SkillCandidate[] = [];
  const cleanups: (() => Promise<void>)[] = [];
  for (const [repoSlug, group] of byRepo) {
    try {
      const { candidates, cleanup } = await discoverFromRepo(repoSlug);
      cleanups.push(cleanup);
      const wantedPaths = new Set(group.map((g) => g.subpath));
      const installByPath = new Map(group.map((g) => [g.subpath, g.installs]));
      for (const c of candidates) {
        // upstream 形如 .../tree/<branch>/<subpath>;取 subpath 匹配 registry 条目
        const sub = c.report.meta.upstream.match(/\/tree\/[^/]+\/(.*)$/)?.[1] ?? "";
        if (wantedPaths.size && !wantedPaths.has(sub) && !wantedPaths.has("")) continue;
        (c.report as SkillReport).signals.installs_skills_sh = installByPath.get(sub) ?? null;
        out.push(c);
      }
    } catch (e) {
      console.warn(`  ✗ skills.sh 仓 ${repoSlug} 采集失败: ${(e as Error).message}`);
    }
  }
  return { candidates: out, cleanup: async () => { await Promise.all(cleanups.map((f) => f().catch(() => {}))); } };
}
