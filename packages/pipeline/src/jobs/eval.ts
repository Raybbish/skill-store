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
import type { EvalRunner } from "../eval/types.ts";
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

  for (const e of todo) {
    const result = await evaluateSkill(e.report.meta.id, category, runner);
    e.report.eval = result;
    await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    const bars = result.tasks.map((t) => `${t.task} ${(t.with_skill.score * 100) | 0}%`).join(" · ");
    console.log(`  ${e.report.meta.id}  →  ${result.score}/10  (净增益 +${result.lift_pp}pp)`);
    console.log(`      ${bars}`);
  }
  console.log(`\n=== eval 完成:${todo.length} 个 skill 已评分 ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
