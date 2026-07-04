/**
 * audit:对 catalog 里的条目跑 L1/L2 静态审计,填充风险五因子。
 * 按上游仓分组、每仓 clone 一次,多仓有界并发;顺带做 content_hash 漂移检测。
 * 用法:npm run audit [-- --all] [--concurrency N] [--repo owner/name]
 *   --all          审全部(默认只审 status=pending 的)
 *   --concurrency  同时并行处理的上游仓数(默认 6)
 *
 * 状态判定(M0,保守):
 *   - L1 critical 命中        → needs_review(恶意签名,机器不放行;交人工定夺)
 *   - network.present         → needs_review(先 hold;交 L3/DeepSeek 判定,非重大风险则自动放行)
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

/** 有界并发:最多 limit 个任务同时在跑,用于并行 clone+扫描多个上游仓。 */
async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const worker = async () => {
    while (i < items.length) await fn(items[i++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function main() {
  const all = process.argv.includes("--all");
  const ri = process.argv.indexOf("--repo");
  const onlyRepo = ri >= 0 ? process.argv[ri + 1] : undefined; // 只审某个上游仓(如 microsoft/azure-skills)
  const ci = process.argv.indexOf("--concurrency");
  const concurrency = ci >= 0 ? Math.max(1, Number(process.argv[ci + 1]) || 6) : 6;
  const entries = (await loadCatalogEntries()).filter(
    (e) => (all || e.report.security_audit.status === "pending") &&
      (!onlyRepo || parseUpstream(e.report.meta.upstream)?.repoSlug === onlyRepo),
  );
  console.log(`待审计条目: ${entries.length}${onlyRepo ? `(仅 ${onlyRepo})` : ""}`);

  // 按上游仓分组,每仓只 clone 一次
  const byRepo = new Map<string, typeof entries>();
  for (const e of entries) {
    const up = parseUpstream(e.report.meta.upstream);
    if (!up) { console.warn(`  ✗ 无法解析上游: ${e.report.meta.id}`); continue; }
    (byRepo.get(up.repoSlug) ?? byRepo.set(up.repoSlug, []).get(up.repoSlug)!).push(e);
  }

  const now = new Date().toISOString();
  const stats = { pass: 0, needs_review: 0, drift: 0, critical: 0 };

  const repos = [...byRepo.entries()];
  const total = repos.length;
  let finished = 0;

  // 单仓审计:clone → 扫描本仓全部条目 → 清理临时目录。
  // 日志整仓缓冲后一次性 flush,避免并发下多仓输出交错。
  async function auditRepo([repoSlug, group]: [string, typeof entries]) {
    const logs = [`\n▶ 审计 ${repoSlug}(${group.length} 条)…`];
    let clone: Awaited<ReturnType<typeof cloneShallow>>;
    try {
      clone = await cloneShallow(repoSlug);
    } catch (err) {
      // 单仓 clone 失败(改名/删除/私有/网络抖动)不应中断整轮:跳过,条目保持 pending,下次重试。
      logs.push(`  ✗ clone 失败,跳过(条目留待下次): ${(err as Error).message}`);
      console.log(logs.join("\n") + `  [${++finished}/${total}]`);
      return;
    }
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
        if (analysis.factors.network?.present) reasons.push("含外部网络请求(hold,交 L3/DeepSeek 判定)");
        if (analysis.factors.env_access?.present && analysis.factors.external_commands?.present)
          reasons.push("env_access + external_commands 组合风险");
        if (drifted) { reasons.push("content_hash 漂移:上游已变更,需重新采集"); stats.drift++; }

        // 最终状态优先级:人工签名 > L3 裁决(未漂移)> L1/L2 本次结果。
        //   已过 L3 且未漂移、本次无 critical → 保留 L3 裁决,不被 L1/L2 重算覆盖(修 --all 重审把
        //   DeepSeek 已放行的网络条目打回 needs_review 的回退)。漂移则丢弃旧 L3 并按本次重判(促使重跑 L3)。
        const prev = r.security_audit as typeof r.security_audit & { review?: unknown; l3?: unknown };
        const keepL3 = Boolean(prev.l3) && !drifted && analysis.criticalHits.length === 0;
        const status = prev.review ? prev.status : keepL3 ? prev.status : reasons.length ? "needs_review" : "pass";
        r.security_audit = {
          status,
          audited_at: now,
          scanner_versions: { ...prev.scanner_versions, ...SCANNER_VERSIONS },
          risk_factors: analysis.factors,
          evidence: [
            ...analysis.evidence,
            ...reasons.map((note) => ({ factor: "review_reason", file: "-", note })),
          ],
          ...(prev.review ? { review: prev.review } : {}),
          ...(prev.l3 && !drifted ? { l3: prev.l3 } : {}), // 漂移则丢弃旧 L3,促使 audit:l3 对新内容重跑
        } as typeof r.security_audit;
        stats[status === "needs_review" ? "needs_review" : "pass"]++;

        await writeFile(e.path, JSON.stringify(r, null, 2) + "\n");
        const mark = status === "needs_review" ? "⚠ needs_review" : "✓ pass";
        const held = keepL3 && reasons.length ? "(L3 已裁决,保留)" : "";
        logs.push(`  ${mark}  ${r.meta.id}${reasons.length ? " — " + reasons.join(";") + held : ""}`);
      }
    } finally {
      await clone.cleanup().catch(() => {}); // 清理失败不影响审计结果
    }
    console.log(logs.join("\n") + `  [${++finished}/${total}]`);
  }

  console.log(`并发: ${concurrency} 仓并行`);
  await mapPool(repos, concurrency, auditRepo);

  console.log(`\n=== audit 完成 ===`);
  console.log(`pass: ${stats.pass} · needs_review: ${stats.needs_review}(其中 critical ${stats.critical}、哈希漂移 ${stats.drift})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
