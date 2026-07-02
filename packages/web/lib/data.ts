/** 构建时直读 catalog(Git 事实源),SSG 用;不依赖任何环境变量 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface Factor { present: boolean | null; detail?: string }
export interface EvalData {
  category: string; runner: string; score: number; lift_pp: number;
  tasks: { task: string; with_skill: { score: number }; without_skill: { score: number }; delta: number }[];
}
export interface Skill {
  id: string; owner: string; name: string; description?: string;
  license: string; hosting: string; publisher: string; upstream: string;
  status: string; risk: Record<string, Factor>;
  evidence: { factor: string; file: string; line?: number | null; note?: string }[];
  review?: { verdict: string; by: string; at: string; note: string };
  l3?: { model: string; verdict?: { intent_summary: string } };
  tokens: number; stars?: number | null;
  curatedBy?: { list: string; category: string }[];
  eval?: EvalData | null;
}

const CATALOG = join(process.cwd(), "../../catalog/skills");

export function allSkills(): Skill[] {
  const out: Skill[] = [];
  for (const owner of readdirSync(CATALOG)) {
    for (const name of readdirSync(join(CATALOG, owner))) {
      try {
        const r = JSON.parse(readFileSync(join(CATALOG, owner, name, "skill-report.json"), "utf8"));
        const sa = r.security_audit;
        out.push({
          id: r.meta.id, owner, name: r.meta.name, description: r.meta.description,
          license: r.meta.license, hosting: r.meta.hosting, publisher: r.meta.publisher,
          upstream: r.meta.upstream, status: sa.status, risk: sa.risk_factors ?? {},
          evidence: sa.evidence ?? [], review: sa.review, l3: sa.l3,
          tokens: r.token_cost?.body_tokens ?? 0, stars: r.signals?.stars_github,
          curatedBy: r.signals?.curated_by ?? [],
          eval: r.eval ?? null,
        });
      } catch { /* skip */ }
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function getSkill(owner: string, name: string): Skill | undefined {
  return allSkills().find((s) => s.owner === owner && s.name === name);
}

/** 同品类已评测的 skill,按评测分降序(横评用) */
export function peersByEval(category: string): Skill[] {
  return allSkills()
    .filter((s) => s.eval?.category === category)
    .sort((a, b) => (b.eval!.score - a.eval!.score));
}

export const FACTOR_LABELS: Record<string, [string, string]> = {
  scripts: ["📜", "脚本执行"], network: ["🌐", "网络请求"], filesystem: ["📂", "文件读写"],
  env_access: ["🔑", "环境变量"], external_commands: ["⚙️", "外部命令"],
};
