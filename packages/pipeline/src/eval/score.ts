/** 评测执行与打分聚合 */
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parse } from "yaml";
import type { EvalRunner, EvalResult, TaskMeta, TaskResult, CondResult, Verifier } from "./types.ts";
import { weightedScore } from "./types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const TASKS_ROOT = join(HERE, "tasks");

export async function loadTasks(category: string): Promise<{ meta: TaskMeta; dir: string; prompt: string; verify: Verifier }[]> {
  const dir = join(TASKS_ROOT, category);
  const out = [];
  for (const name of await readdir(dir)) {
    const tdir = join(dir, name);
    try {
      const meta = parse(await readFile(join(tdir, "task.yaml"), "utf8")) as TaskMeta;
      const prompt = await readFile(join(tdir, "prompt.md"), "utf8");
      const verify = (await import(join(tdir, "verify.ts"))).default as Verifier;
      out.push({ meta, dir: tdir, prompt, verify });
    } catch (e) {
      console.warn(`  ✗ 跳过任务 ${name}: ${(e as Error).message}`);
    }
  }
  return out;
}

/** 对一个 skill 跑完整品类评测。产物缺失 / runner 异常 → 标 N/A(不计 0 分,排除出统计) */
export async function evaluateSkill(skillId: string, category: string, runner: EvalRunner): Promise<EvalResult> {
  const tasks = await loadTasks(category);
  const results: TaskResult[] = [];

  for (const t of tasks) {
    const runOne = async (condition: "with_skill" | "without_skill"): Promise<CondResult> => {
      const workDir = await mkdtemp(join(tmpdir(), `eval-${t.meta.id}-`));
      try {
        // 预置输入
        const inputsDir = join(t.dir, "inputs");
        await cp(inputsDir, join(workDir, "inputs"), { recursive: true }).catch(() => {});
        let artifactPath: string | null;
        try {
          ({ artifactPath } = await runner.run({
            skillId, task: t.meta, prompt: t.prompt, inputsDir, workDir, condition,
          }));
        } catch (e) {
          // runner 抛错(取不到 SKILL.md、LLM 报错等):不可评估,标 N/A
          return { score: null, checks: [], status: "na", note: `runner 异常:${(e as Error).message}` };
        }
        // 关键修复:产物缺失 = "本环境跑不出来",不是"质量为 0"——标 N/A 排除,而非记 0 拉低分
        if (!artifactPath)
          return { score: null, checks: [], status: "na", note: "未产出预期产物(疑似本环境不支持该 skill 的执行方式)" };
        const checks = await t.verify(artifactPath);
        return { score: weightedScore(checks), checks, status: "ok" };
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    };

    const withS = await runOne("with_skill");
    const withoutS = await runOne("without_skill");
    const bothOk = withS.status === "ok" && withoutS.status === "ok";
    results.push({
      task: t.meta.id,
      with_skill: withS,
      without_skill: withoutS,
      // 诚实增益:允许为负(skill 反而更差);任一条件 N/A 无法比较 → null
      delta: bothOk ? Math.round((withS.score! - withoutS.score!) * 1000) / 1000 : null,
      // with_skill 是否可评估决定该任务是否计入 skill 总分
      status: withS.status,
    });
  }

  // 总分:仅统计 with_skill 可评估的任务(N/A 不拉低分数)
  const scored = results.filter((r) => r.status === "ok");
  const avgWith = scored.length ? scored.reduce((a, r) => a + (r.with_skill.score ?? 0), 0) / scored.length : null;
  // 净增益:仅统计双条件都可评估的任务(否则 with/without 不可比)
  const pairs = results.filter((r) => r.with_skill.status === "ok" && r.without_skill.status === "ok");
  const liftWith = pairs.length ? pairs.reduce((a, r) => a + (r.with_skill.score ?? 0), 0) / pairs.length : null;
  const liftWithout = pairs.length ? pairs.reduce((a, r) => a + (r.without_skill.score ?? 0), 0) / pairs.length : null;

  return {
    category, runner: runner.name, model: runner.model, evaluated_at: new Date().toISOString(),
    score: avgWith === null ? null : Math.round(avgWith * 100) / 10, // 0-10
    lift_pp: liftWith === null || liftWithout === null ? null : Math.round((liftWith - liftWithout) * 1000) / 10,
    evaluable_tasks: scored.length,
    total_tasks: results.length,
    tasks: results,
  };
}
