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
  /** 模型标识(真实 runner 填,如 "deepseek-chat";mock 省略)。用于结果元数据与写入闸 */
  model?: string;
  run(args: {
    skillId: string;
    task: TaskMeta;
    prompt: string;
    inputsDir: string;
    workDir: string;
    condition: Condition;
  }): Promise<{ artifactPath: string | null }>;
}

/** 单条件(装/不装)运行结果。status=na 表示未产出产物 / runner 异常,不参与计分 */
export interface CondResult {
  /** 加权得分 0-1;status=na 时为 null(区别于"评到 0 分") */
  score: number | null;
  checks: Check[];
  status: "ok" | "na";
  /** na 原因(如"本环境未产出产物") */
  note?: string;
}

/** 单任务在两条件下的评测结果 */
export interface TaskResult {
  task: string;
  with_skill: CondResult;
  without_skill: CondResult;
  /** 增益:with - without(0-1,可为负);任一条件 na 时为 null(无法比较) */
  delta: number | null;
  /** 任务级:with_skill 不可评估则整任务 na,排除出总分 */
  status: "ok" | "na";
}

/** 一个 skill 的完整评测结果(写入 skill-report.eval) */
export interface EvalResult {
  category: string;
  runner: string;
  /** 模型元数据(真实 runner 必填,如 "deepseek-chat";mock 省略)。写入闸据此拒绝无模型结果 */
  model?: string;
  evaluated_at: string;
  /** 0-10,可评估任务 with_skill 加权均值×10;无可评估任务时 null */
  score: number | null;
  /** 双条件均可评估任务上的净增益(百分点);样本不足时 null */
  lift_pp: number | null;
  /** 计入总分的任务数 / 任务总数(evaluable < total 说明有 N/A,疑似环境不匹配) */
  evaluable_tasks: number;
  total_tasks: number;
  tasks: TaskResult[];
}

export function weightedScore(checks: Check[]): number {
  const total = checks.reduce((a, c) => a + c.weight, 0);
  if (total === 0) return 0;
  const got = checks.reduce((a, c) => a + (c.pass ? c.weight : 0), 0);
  return got / total; // 0-1
}
