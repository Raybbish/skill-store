/** 评测执行与打分聚合 */
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parse } from "yaml";
import type { EvalRunner, EvalResult, TaskMeta, TaskResult, Verifier } from "./types.ts";
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

/** 对一个 skill 跑完整品类评测 */
export async function evaluateSkill(skillId: string, category: string, runner: EvalRunner): Promise<EvalResult> {
  const tasks = await loadTasks(category);
  const results: TaskResult[] = [];

  for (const t of tasks) {
    const runOne = async (condition: "with_skill" | "without_skill") => {
      const workDir = await mkdtemp(join(tmpdir(), `eval-${t.meta.id}-`));
      try {
        // 预置输入
        const inputsDir = join(t.dir, "inputs");
        await cp(inputsDir, join(workDir, "inputs"), { recursive: true }).catch(() => {});
        const { artifactPath } = await runner.run({
          skillId, task: t.meta, prompt: t.prompt, inputsDir, workDir, condition,
        });
        if (!artifactPath) return { score: 0, checks: [] };
        const checks = await t.verify(artifactPath);
        return { score: weightedScore(checks), checks };
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    };

    const withS = await runOne("with_skill");
    const withoutS = await runOne("without_skill");
    results.push({
      task: t.meta.id,
      with_skill: withS,
      without_skill: withoutS,
      delta: Math.max(0, withS.score - withoutS.score),
    });
  }

  const avgWith = results.reduce((a, r) => a + r.with_skill.score, 0) / (results.length || 1);
  const avgWithout = results.reduce((a, r) => a + r.without_skill.score, 0) / (results.length || 1);
  return {
    category, runner: runner.name, evaluated_at: new Date().toISOString(),
    score: Math.round(avgWith * 100) / 10,          // 0-10
    lift_pp: Math.round((avgWith - avgWithout) * 1000) / 10, // 百分点
    tasks: results,
  };
}
