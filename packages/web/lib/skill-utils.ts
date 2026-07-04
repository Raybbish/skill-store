/** 排序信号最小面:全量 Skill 与瘦 SkillCard 都满足,排序函数两边通用 */
export interface PopSignals {
  stars?: number | null;
  installs?: number | null;
  repoSkillCount?: number;
}

/** 安装量友好格式:1234567 → 1.2M */
export function fmtInstalls(n: number): string {
  if (n >= 1e6) return `${Math.round(n / 1e5) / 10}M`;
  if (n >= 1e3) return `${Math.round(n / 100) / 10}K`;
  return String(n);
}

/** stars 按 repo_skill_count 归一,抑制巨仓(单 skill 仓不变;N-skill 仓 ÷√N);无 stars 记 0 */
export function normStars(s: PopSignals): number {
  if (s.stars == null) return 0;
  return s.stars / Math.sqrt(Math.max(1, s.repoSkillCount ?? 1));
}

/** 货架统一排序:归一 stars 主键,installs 兜底次键(给仅 skills.sh 有数的少数条目排序) */
export function byPopularity(a: PopSignals, b: PopSignals): number {
  const d = normStars(b) - normStars(a);
  return d !== 0 ? d : (b.installs ?? 0) - (a.installs ?? 0);
}

/**
 * 每仓上限(per-repo cap):热门排序里同一仓库最多占 cap 席,溢出条目保持相对顺序
 * 挪到列表尾部。解决「repo 级 stars 致同仓 skill 同分聚顶」(ADR 0005 遗留)。
 * 只用于「热门」语义的列表;搜索按相关度排序时不适用。
 */
export function applyRepoCap<T extends { owner: string; repo: string }>(list: T[], cap = 3): T[] {
  const seen = new Map<string, number>();
  const head: T[] = [];
  const tail: T[] = [];
  for (const it of list) {
    const k = `${it.owner}/${it.repo}`;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    (n <= cap ? head : tail).push(it);
  }
  return tail.length ? head.concat(tail) : head;
}

export const FACTOR_LABELS: Record<string, [string, string]> = {
  scripts: ["📜", "脚本执行"], network: ["🌐", "网络请求"], filesystem: ["📂", "文件读写"],
  env_access: ["🔑", "环境变量"], external_commands: ["⚙️", "外部命令"],
};
