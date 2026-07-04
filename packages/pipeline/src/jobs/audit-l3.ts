// ⛔ 已下架(2026-07-04,ADR 见 docs/decisions):安全扫描整套功能暂停,npm scripts 已移除。
// 代码保留仅作重新设计时参考,勿直接重新接线。详见 docs/STATUS.md。
/**
 * audit-l3:对已过 L1/L2 的条目跑 LLM(默认 DeepSeek)意图审查,并由它做最终裁决。
 * 裁决口径:仅「重大风险」转人工——外传路径 / 提示注入 / 模型自评 severity=major / L1 恶意签名命中;
 *   其余(含仅有网络、文档与代码不符等软性问题)由 DeepSeek 自动放行为 pass,
 *   可下调 L1/L2 因网络等 hold 住的 needs_review(不再「只升不降」)。
 * fail-closed:LLM 调用 / 解析失败 → needs_review,绝不默认放行。
 * 已 rejected 或已人工复核(有 review 签名)的条目跳过,人工决定优先于机器。
 *
 * 用法:npm run audit:l3 [-- --limit N] [-- --id owner/repo/name]
 * 环境:LLM_BASE_URL(默认 DeepSeek)/ LLM_API_KEY / LLM_MODEL,或 LLM_MOCK=1
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type { SkillReport } from "@skill-store/schemas";
import { cloneShallow } from "../git.ts";
import { l3Review, buildReviewContent } from "../scanners/llm.ts";
import { loadCatalogEntries } from "../catalog.ts";

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

  const entries = (await loadCatalogEntries()) as Entry[];

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
          sa.l3 = { model: result.model, at, decision: "failed", error: result.error };
          sa.evidence.push({ factor: "review_reason", file: "-", note: `L3 调用失败(fail-closed): ${result.error}` });
          stats.failed++;
          console.log(`  ⚠ l3_failed → needs_review  ${e.report.meta.id} — ${result.error}`);
        } else {
          const v = result.verdict!;
          sa.scanner_versions = { ...sa.scanner_versions, l3_model: result.model };

          // 重大风险判定(调这一处即改变「什么算重大风险 → 转人工」的口径):
          //   外传路径 / 提示注入 / 模型自评 major / L1 恶意签名命中(malware,机器不得放行)。
          const l1Critical = sa.evidence.some(
            (ev) => ev.factor === "review_reason" && /critical|恶意签名/i.test(ev.note ?? ""),
          );
          const major = v.exfiltration_path || v.injection_suspected || v.severity === "major" || l1Critical;

          if (major) {
            const reasons = [
              v.exfiltration_path && "疑似外传路径",
              v.injection_suspected && "疑似提示注入",
              v.severity === "major" && "模型判定重大风险",
              l1Critical && "L1 恶意签名命中",
            ].filter(Boolean) as string[];
            sa.status = "needs_review";
            sa.l3 = { model: result.model, at, decision: "escalated", verdict: v };
            for (const r of reasons) sa.evidence.push({ factor: "review_reason", file: "-", note: `L3: ${r}` });
            stats.escalated++;
            console.log(`  ⚠ 转人工(重大风险)  ${e.report.meta.id} — ${reasons.join(";")}`);
          } else {
            // DeepSeek 自动放行:非重大风险(含仅网络、文档/代码不符等)判为 pass,
            // 可下调 L1/L2 因网络等 hold 住的 needs_review。软性发现只记录、不拦截。
            const soft = [
              !v.doc_code_consistent && "文档与代码不一致",
              v.hidden_instructions && "疑似隐藏指令",
            ].filter(Boolean) as string[];
            sa.status = "pass";
            sa.l3 = { model: result.model, at, decision: "auto_pass", auto_approved: true, verdict: v };
            for (const s of soft) sa.evidence.push({ factor: "l3_note", file: "-", note: `L3(不拦截): ${s}` });
            stats.pass++;
            console.log(`  ✓ 自动放行  ${e.report.meta.id}${soft.length ? " — 记录:" + soft.join(";") : ""} · ${v.intent_summary}`);
          }
        }
        await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
      }
    } finally { await clone.cleanup(); }
  }
  console.log(`\n=== L3 完成 === 自动放行: ${stats.pass} · 转人工(重大风险): ${stats.escalated} · 失败(fail-closed): ${stats.failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
