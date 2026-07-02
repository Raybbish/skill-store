/** 评测系统类型 */

/** 单条确定性检查 */
export interface Check {
  id: string;
  pass: boolean;
  weight: number;
  note?: string;
}

/** 任务定义(每个任务目录一份 task.yaml + prompt.md + inputs/ + verify.ts) */
export interface TaskMeta {
  id: string;
  category: string;
  /** 期望产物文件名(相对工作目录) */
  artifact: string;
  /** 预置输入文件名 */
  inputs: string[];
  /** 该任务在品类内的权重 */
  weight: number;
  /** 一句话描述考察点 */
  probes: string;
}

/** 校验器:对产物路径返回一组 checks(全确定性,不调用 LLM) */
export type Verifier = (artifactPath: string) => Promise<Check[]> | Check[];

/** 运行条件 */
export type Condition = "with_skill" | "without_skill";

/**
 * Runner 抽象:给定任务与条件,执行(装/不装 skill 的 agent 跑任务),
 * 返回产物文件路径。真实实现接 agent runtime;mock 实现用于跑通管线。
 */
export interface EvalRunner {
  name: string;
  run(args: {
    skillId: string;
    task: TaskMeta;
    prompt: string;
    inputsDir: string;
    workDir: string;
    condition: Condition;
  }): Promise<{ artifactPath: string | null }>;
}

/** 单任务在两条件下的评测结果 */
export interface TaskResult {
  task: string;
  with_skill: { score: number; checks: Check[] };
  without_skill: { score: number; checks: Check[] };
  /** 增益:with - without,0-1 */
  delta: number;
}

/** 一个 skill 的完整评测结果(写入 skill-report.eval) */
export interface EvalResult {
  category: string;
  runner: string;
  evaluated_at: string;
  /** 0-10,综合得分(with_skill 加权均值 ×10) */
  score: number;
  /** 相对不装的净增益(百分点) */
  lift_pp: number;
  tasks: TaskResult[];
}

export function weightedScore(checks: Check[]): number {
  const total = checks.reduce((a, c) => a + c.weight, 0);
  if (total === 0) return 0;
  const got = checks.reduce((a, c) => a + (c.pass ? c.weight : 0), 0);
  return got / total; // 0-1
}
