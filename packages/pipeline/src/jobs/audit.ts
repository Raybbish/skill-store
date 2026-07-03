/**
 * audit:对 catalog 里的条目跑 L1/L2 静态审计,填充风险五因子。
 * 按上游仓分组、每仓 clone 一次;顺带做 content_hash 漂移检测。
 * 用法:npm run audit [-- --all](默认只审 status=pending 的)
 *
 * 状态判定(M0,保守):
 *   - L1 critical 命中        → needs_review(不自动 reject,人工定夺)
 *   - network.present         → needs_review(设计红线:含外联一律人工放行)
 *   - env_access + external_commands 同时出现 → needs_review(组合风险)
 *   - content_hash 漂移       → needs_review(上游已变更,需重新采集)
 *   - 其余                    → pass
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cloneShallow } from "../git.ts";
import { contentHash } from "../hash.ts";
import { analyzeSkillDir } from "../scanners/analyze.ts";
import { SCANNER_VERSIONS } from "../scanners/rules.ts";
import { loadCatalogEntries } from "../catalog.ts";

function parseUpstream(url: string): { repoSlug: string; dir: string } | null {
  const m = url.match(/github\.com\/([^/]+\/[^/]+)\/tree\/[^/]+\/?(.*)$/);
  return m ? { repoSlug: m[1], dir: m[2] ? m[2] + "/" : "" } : null;
}

async function main() {
  const all = process.argv.includes("--all");
  const entries = (await loadCatalogEntries()).filter(
    (e) => all || e.report.security_audit.status === "pending",
  );
  console.log(`待审计条目: ${entries.length}`);

  // 按上游仓分组,每仓只 clone 一次
  const byRepo = new Map<string, typeof entries>();
  for (const e of entries) {
    const up = parseUpstream(e.report.meta.upstream);
    if (!up) { console.warn(`  ✗ 无法解析上游: ${e.report.meta.id}`); continue; }
    (byRepo.get(up.repoSlug) ?? byRepo.set(up.repoSlug, []).get(up.repoSlug)!).push(e);
  }

  const now = new Date().toISOString();
  const stats = { pass: 0, needs_review: 0, drift: 0, critical: 0 };

  for (const [repoSlug, group] of byRepo) {
    console.log(`\n▶ 审计 ${repoSlug}(${group.length} 条)…`);
    const clone = await cloneShallow(repoSlug);
    try {
      for (const e of group) {
        const { dir } = parseUpstream(e.report.meta.upstream)!;
        const r = e.report;

        // 哈希漂移检测:上游当前内容 vs 采集时指纹
        const nowHash = contentHash(dir, clone.entries);
        const drifted = nowHash !== r.meta.content_hash;

        const analysis = await analyzeSkillDir(join(clone.dir, dir));

        const reasons: string[] = [];
        if (analysis.criticalHits.length) { reasons.push(`L1 命中 ${analysis.criticalHits.length} 条 critical 签名`); stats.critical++; }
        if (analysis.factors.network?.present) reasons.push("含外部网络请求(红线:人工放行)");
        if (analysis.factors.env_access?.present && analysis.factors.external_commands?.present)
          reasons.push("env_access + external_commands 组合风险");
        if (drifted) { reasons.push("content_hash 漂移:上游已变更,需重新采集"); stats.drift++; }

        // 保留人工签名与 L3 结果:重审只更新 L1/L2 产出,人工决定优先于机器
        const prev = r.security_audit as typeof r.security_audit & { review?: unknown; l3?: unknown };
        r.security_audit = {
          status: prev.review ? prev.status : reasons.length ? "needs_review" : "pass",
          audited_at: now,
          scanner_versions: { ...prev.scanner_versions, ...SCANNER_VERSIONS },
          risk_factors: analysis.factors,
          evidence: [
            ...analysis.evidence,
            ...reasons.map((note) => ({ factor: "review_reason", file: "-", note })),
          ],
          ...(prev.review ? { review: prev.review } : {}),
          ...(prev.l3 ? { l3: prev.l3 } : {}),
        } as typeof r.security_audit;
        stats[reasons.length ? "needs_review" : "pass"]++;

        await writeFile(e.path, JSON.stringify(r, null, 2) + "\n");
        const mark = reasons.length ? "⚠ needs_review" : "✓ pass";
        console.log(`  ${mark}  ${r.meta.id}${reasons.length ? " — " + reasons.join(";") : ""}`);
      }
    } finally {
      await clone.cleanup();
    }
  }

  console.log(`\n=== audit 完成 ===`);
  console.log(`pass: ${stats.pass} · needs_review: ${stats.needs_review}(其中 critical ${stats.critical}、哈希漂移 ${stats.drift})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
