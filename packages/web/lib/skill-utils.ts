import type { Skill } from "./skill-types";

/** 安装量友好格式:1234567 → 1.2M */
export function fmtInstalls(n: number): string {
  if (n >= 1e6) return `${Math.round(n / 1e5) / 10}M`;
  if (n >= 1e3) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

/** stars 按 repo_skill_count 归一,抑制巨仓(单 skill 仓不变;N-skill 仓 ÷√N);无 stars 记 0 */
export function normStars(s: Skill): number {
  if (s.stars == null) return 0;
  return s.stars / Math.sqrt(Math.max(1, s.repoSkillCount ?? 1));
}

/** 货架统一排序:归一 stars 主键,installs 兜底次键(给仅 skills.sh 有数的少数条目排序) */
export function byPopularity(a: Skill, b: Skill): number {
  const d = normStars(b) - normStars(a);
  return d !== 0 ? d : (b.installs ?? 0) - (a.installs ?? 0);
}

export const FACTOR_LABELS: Record<string, [string, string]> = {
  scripts: ["📜", "脚本执行"], network: ["🌐", "网络请求"], filesystem: ["📂", "文件读写"],
  env_access: ["🔑", "环境变量"], external_commands: ["⚙️", "外部命令"],
};
