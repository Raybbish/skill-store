/**
 * audit-l3:对已过 L1/L2 的条目跑 LLM 意图审查。
 * 升级规则(只升不降):任何可疑 flag / 调用失败 → needs_review;pass 保持 pass 并记录 l3 结果。
 * 已 rejected 或已人工复核(有 review 签名)的条目跳过,避免覆盖人工决定。
 *
 * 用法:npm run audit:l3 [-- --limit N] [-- --id owner/name]
 * 环境:LLM_BASE_URL / LLM_API_KEY / LLM_MODEL,或 LLM_MOCK=1
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { SkillReport } from "@skill-store/schemas";
import { cloneShallow } from "../git.ts";
import { l3Review, buildReviewContent } from "../scanners/llm.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const CATALOG = join(ROOT, "catalog", "skills");
const SCRIPT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|rb|pl|ps1)$/i;

function arg(n: string) { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; }

interface Entry { path: string; report: SkillReport & { security_audit: SkillReport["security_audit"] & { review?: unknown; l3?: unknown } }; }

function parseUpstream(url: string) {
  const m = url.match(/github\.com\/([^/]+\/[^/]+)\/tree\/[^/]+\/?(.*)$/);
  return m ? { repoSlug: m[1], dir: m[2] ? m[2] + "/" : "" } : null;
}

async function main() {
  const limit = arg("limit") ? Number(arg("limit")) : Infinity;
  const onlyId = arg("id");

  const entries: Entry[] = [];
  for (const owner of await readdir(CATALOG)) {
    for (const name of await readdir(join(CATALOG, owner))) {
      try {
        const p = join(CATALOG, owner, name, "skill-report.json");
        const report = JSON.parse(await readFile(p, "utf8"));
        entries.push({ path: p, report });
      } catch { /* skip */ }
    }
  }

  const todo = entries.filter((e) => {
    const sa = e.report.security_audit;
    if (onlyId) return e.report.meta.id === onlyId;
    if (sa.status === "rejected" || sa.status === "pending") return false;
    if (sa.review) return false; // 人工已定夺,不覆盖
    if (sa.l3) return false;     // 已跑过 L3
    return true;
  }).slice(0, limit);
  console.log(`L3 待审: ${todo.length} 条(model: ${process.env.LLM_MOCK === "1" ? "mock" : process.env.LLM_MODEL ?? "默认"})`);

  const byRepo = new Map<string, Entry[]>();
  for (const e of todo) {
    const up = parseUpstream(e.report.meta.upstream);
    if (up) (byRepo.get(up.repoSlug) ?? byRepo.set(up.repoSlug, []).get(up.repoSlug)!).push(e);
  }

  const stats = { pass: 0, escalated: 0, failed: 0 };
  for (const [repoSlug, group] of byRepo) {
    const clone = await cloneShallow(repoSlug);
    try {
      for (const e of group) {
        const { dir } = parseUpstream(e.report.meta.upstream)!;
        const base = join(clone.dir, dir);
        const skillMd = await readFile(join(base, "SKILL.md"), "utf8").catch(() => "");
        const scripts: { path: string; content: string }[] = [];
        for (const ent of clone.entries.filter((x) => x.path.startsWith(dir) && SCRIPT_EXT.test(x.path))) {
          const p = join(clone.dir, ent.path);
          scripts.push({ path: relative(base, p), content: await readFile(p, "utf8").catch(() => "") });
        }
        const l2Summary = JSON.stringify(e.report.security_audit.risk_factors);
        const allFiles = clone.entries
          .filter((x) => x.path.startsWith(dir))
          .map((x) => x.path.slice(dir.length));
        const result = await l3Review(buildReviewContent(skillMd, scripts, l2Summary, allFiles));

        const sa = e.report.security_audit as Entry["report"]["security_audit"];
        const at = new Date().toISOString();
        if (!result.ok) {
          sa.status = "needs_review";
          sa.l3 = { model: result.model, at, error: result.error };
          sa.evidence.push({ factor: "review_reason", file: "-", note: `L3 调用失败(fail-closed): ${result.error}` });
          stats.failed++;
          console.log(`  ⚠ l3_failed → needs_review  ${e.report.meta.id} — ${result.error}`);
        } else {
          const v = result.verdict!;
          const flags = [
            !v.doc_code_consistent && "文档与代码不一致",
            v.hidden_instructions && "疑似隐藏指令",
            v.injection_suspected && "疑似提示注入",
            v.exfiltration_path && "疑似外传路径",
          ].filter(Boolean) as string[];
          sa.l3 = { model: result.model, at, verdict: v };
          sa.scanner_versions = { ...sa.scanner_versions, l3_model: result.model };
          if (flags.length) {
            sa.status = "needs_review";
            for (const f of flags) sa.evidence.push({ factor: "review_reason", file: "-", note: `L3: ${f}` });
            stats.escalated++;
            console.log(`  ⚠ escalated  ${e.report.meta.id} — ${flags.join(";")}`);
          } else {
            stats.pass++;
            console.log(`  ✓ l3 clean  ${e.report.meta.id} — ${v.intent_summary}`);
          }
        }
        await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
      }
    } finally { await clone.cleanup(); }
  }
  console.log(`\n=== L3 完成 === clean: ${stats.pass} · 升级: ${stats.escalated} · 失败(fail-closed): ${stats.failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
