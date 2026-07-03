/**
 * eval:对指定品类下已通过审计的 skill 跑基准评测,回写 skill-report.eval。
 * 用法:npm run eval -- --category doc-generation [--id anthropics/skills/docx] [--runner mock]
 * 目前仅 mock runner;真实 runner(接 agent runtime)后续加入 runner/ 并在此注册。
 */
import { writeFile } from "node:fs/promises";
import type { SkillReport } from "@skill-store/schemas";
import { evaluateSkill } from "../eval/score.ts";
import { mockRunner } from "../eval/runner/mock.ts";
import { openaiRunner } from "../eval/runner/openai.ts";
import type { EvalRunner, EvalResult } from "../eval/types.ts";
import { loadCatalogEntries } from "../catalog.ts";

const RUNNERS: Record<string, EvalRunner> = { mock: mockRunner, openai: openaiRunner };

function arg(n: string) { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; }

/** 该 skill 是否属于本次评测品类(M0 无 category 字段,用简单关键词映射兜底) */
function inCategory(r: SkillReport, category: string): boolean {
  if (r.meta.category === category) return true;
  if (category === "doc-generation") {
    return /docx|pptx|xlsx|pdf|slide|doc|excel|word|artifact|brand|canvas|theme/i.test(r.meta.id + " " + (r.meta.description ?? ""));
  }
  return false;
}

/**
 * 写入闸:只有可信、可复现的真实结果才允许回写货架。
 * 拒绝 mock、缺模型元数据、全 N/A、或存在 N/A 任务(疑似环境不匹配)的结果。
 * 返回拒绝原因;null 表示可写入。
 */
function rejectReason(r: EvalResult): string | null {
  if (r.runner.startsWith("mock") || !r.model) return "非真实 runner / 缺模型元数据,不可复现";
  if (r.score === null || r.evaluable_tasks === 0) return "无可评估任务(全 N/A)";
  if (r.evaluable_tasks < r.total_tasks)
    return `${r.total_tasks - r.evaluable_tasks}/${r.total_tasks} 任务不可评估(疑似环境不匹配,先修环境再出分)`;
  return null;
}

async function main() {
  const category = arg("category") ?? "doc-generation";
  const onlyId = arg("id");
  const runner = RUNNERS[arg("runner") ?? "mock"];
  if (!runner) throw new Error(`未知 runner: ${arg("runner")}`);

  const entries = await loadCatalogEntries();

  const todo = entries.filter((e) =>
    (onlyId ? e.report.meta.id === onlyId : inCategory(e.report, category)) &&
    e.report.security_audit.status === "pass",
  );
  console.log(`评测品类 ${category} · runner ${runner.name} · ${todo.length} 个 skill\n`);

  let written = 0, skipped = 0;
  for (const e of todo) {
    const result = await evaluateSkill(e.report.meta.id, category, runner);
    const reason = rejectReason(result);
    if (reason) {
      skipped++;
      console.log(`  ✗ ${e.report.meta.id}  →  跳过写入:${reason}`);
      continue;
    }
    e.report.eval = result;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    written++;
    const bars = result.tasks
      .map((t) => `${t.task} ${t.with_skill.status === "ok" ? `${(t.with_skill.score! * 100) | 0}%` : "N/A"}`)
      .join(" · ");
    const lift = result.lift_pp === null ? "N/A" : `${result.lift_pp >= 0 ? "+" : ""}${result.lift_pp}pp`;
    console.log(`  ${e.report.meta.id}  →  ${result.score}/10  (净增益 ${lift};${result.evaluable_tasks}/${result.total_tasks} 可评估)`);
    console.log(`      ${bars}`);
  }
  console.log(`\n=== eval 完成:写入 ${written} · 跳过 ${skipped}(共 ${todo.length}) ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
