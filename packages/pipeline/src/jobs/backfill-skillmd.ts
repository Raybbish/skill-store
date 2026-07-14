/**
 * backfill:skillmd —— 存量条目的正文快照回填(ADR 0025 S0)。
 *
 * ingest 只覆盖 sources.yaml 官方仓的常规重访;github-search / code-search / skills.sh 线
 * 发现的长尾条目不会被例行重克隆,存量正文靠本 job 从上游 raw 拉取补齐。
 *
 * 目标集:宽松证(PERMISSIVE_LICENSES)且磁盘无正文(无 mirror/SKILL.md 也无 skill.md)
 * 且未退市 / 非拷贝的条目。**只收 pinned 拉取**(ref = upstream_commit,与 content_hash 同代);
 * commit 被 force-push 剪掉时不退分支兜底——快照必须与货架数据同代,分支最新内容可能已前进,
 * 展示会跟「版本 <commit>」标注打架。拉不到的等下次采集观测自然覆盖。
 *
 * 用法:
 *   npm run backfill:skillmd -- --scope hot          # 场景包成员 ∪ 人气 top(默认 1000),热门先行
 *   npm run backfill:skillmd -- --scope all          # 全量(约 1 万次 raw 拉取,分批跑)
 *   npm run backfill:skillmd -- --scope all --min-stars 1000   # 全量里按 GitHub star 阈值圈定(≥1000)
 *   npm run backfill:skillmd -- --top 500            # 调热门集大小
 *   npm run backfill:skillmd -- --limit 50 --dry     # 试跑不写盘
 * 并发 SKILLMD_CONCURRENCY(默认 8);raw.githubusercontent 无需 token。
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PERMISSIVE_LICENSES } from "@skill-store/schemas";
import { loadCatalogEntries, entryDir, type CatalogEntry } from "../catalog.ts";
import { skillMdOnDisk, fetchSkillMd, SKILLMD_SNAPSHOT } from "../skillmd.ts";
import { hotIds } from "../hot.ts";

const argVal = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const CONCURRENCY = Number(process.env.SKILLMD_CONCURRENCY) || 8;

async function main() {
  const scope = argVal("scope") ?? "hot";
  const top = argVal("top") ? Number(argVal("top")) : 1000;
  const minStars = argVal("min-stars") ? Number(argVal("min-stars")) : undefined;
  const limit = argVal("limit") ? Number(argVal("limit")) : Infinity;
  const dry = hasFlag("dry");

  const entries = await loadCatalogEntries();
  const eligible = entries.filter((e) => {
    const m = e.report.meta;
    if (m.duplicate_of || m.delisted_at) return false;
    if (!PERMISSIVE_LICENSES.has(m.license)) return false;
    return skillMdOnDisk(m.id) == null;
  });

  let pool = eligible;
  if (scope === "hot") {
    const hot = await hotIds(entries.filter((e) => !e.report.meta.duplicate_of && !e.report.meta.delisted_at), top);
    pool = eligible.filter((e) => hot.has(e.report.meta.id));
  }
  // --min-stars N:任意 scope 之上再按 GitHub star 阈值圈定(仓库级 star,同仓 skill 共享)
  if (minStars != null) {
    pool = pool.filter((e) => (e.report.signals.stars_github ?? 0) >= minStars);
  }
  const targets = pool.slice(0, limit);

  console.log(
    `backfill:skillmd  scope=${scope}${scope === "hot" ? `(top=${top})` : ""}${minStars != null ? `  ★≥${minStars}` : ""}  ` +
      `缺快照 ${eligible.length} · 本次目标 ${targets.length} · 并发 ${CONCURRENCY}${dry ? "  (dry)" : ""}`,
  );

  let written = 0, unpinned = 0, failed = 0, done = 0;
  async function handle(e: CatalogEntry) {
    const got = await fetchSkillMd(e.report);
    if (!got) {
      failed++;
    } else if (!got.pinned) {
      // 分支兜底命中 = commit 已被剪:内容可能与 content_hash 不同代,不落快照(诚实优先)
      unpinned++;
    } else {
      if (!dry) await writeFile(join(entryDir(e.report.meta.id), SKILLMD_SNAPSHOT), got.text);
      written++;
    }
    if (++done % 100 === 0) console.log(`  … ${done}/${targets.length}(写入 ${written})`);
  }

  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
      while (idx < targets.length) await handle(targets[idx++]);
    }),
  );

  console.log(`\n=== backfill:skillmd ${dry ? "(dry,未写盘)" : "完成"} ===`);
  console.log(`写入 ${written} · 拉取失败 ${failed} · commit 已剪跳过(留待下次采集) ${unpinned}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
