/**
 * promote.ts —— 分类晋级 / 降级 job(数据驱动 taxonomy 的核心)
 *
 * 长期最优 taxonomy 的关键:顶级分类不由人手拍,而由供给数据自动提议增删。
 *   - 标签(featured:false)连续 N 周期站上阈值(占比 + 绝对量)、且**语义独立**
 *     (不是某大类的子面)→ 提议升为顶级分类。
 *   - 顶级分类(featured:true)连续 N 周期失守 → 提议降级为标签。
 *
 * 纪律:本 job **只出提案、不自动翻 flag**。`featured` 的变更走 labels.ts 的 PR(人工确认),
 * 与「catalog 变更走 PR」「判不准进人工」一致——避免导航 / SEO 被自动改。
 *
 * 运行:  tsx packages/pipeline/src/jobs/promote.ts [--json]
 * 状态:  catalog/_meta/label-stats.json(累计每标签的达标 / 失守连续周期数)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LABELS, labelBySlug, type LabelDef } from '@skill-store/schemas';
import { categorize } from '../categorize';

const CATALOG = resolve(process.cwd(), 'catalog/skills');
const STATE_FILE = resolve(process.cwd(), 'catalog/_meta/label-stats.json');

interface LabelStat {
  slug: string;
  featured: boolean;
  /** 覆盖量:作为主分类或标签命中该标签的 skill 数 */
  coverage: number;
  share: number;
  /** 标签成员里已被现有 featured 分类收纳的占比(独立性闸;仅 tag 关心) */
  absorbedShare: number;
  absorbedInto: string | null;
  /** 连续达标(tag)/ 连续失守(featured)的周期数 */
  streak: number;
  proposal: 'promote' | 'demote' | null;
}

interface StateFile {
  updated_at: string;
  total: number;
  streaks: Record<string, number>;
  stats: LabelStat[];
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name === 'skill-report.json') out.push(p);
  }
  return out;
}

function main(): void {
  const files = walk(CATALOG);
  const total = files.length;
  if (total === 0) {
    console.error(`no skill-report.json under ${CATALOG}`);
    process.exit(1);
  }

  // coverage[label] = 命中该标签(主分类或标签位)的 skill 数
  const coverage: Record<string, number> = {};
  // tagPrimary[tag][category] = 该标签成员里,主分类为 category 的数量(算独立性)
  const tagPrimary: Record<string, Record<string, number>> = {};
  for (const l of LABELS) { coverage[l.slug] = 0; tagPrimary[l.slug] = {}; }

  for (const f of files) {
    const meta = (JSON.parse(readFileSync(f, 'utf8')).meta ?? {}) as { id: string; name?: string; description?: string };
    const { category, tags } = categorize(meta);
    const hit = new Set<string>([...(category !== 'uncategorized' ? [category] : []), ...tags]);
    for (const slug of hit) coverage[slug] = (coverage[slug] ?? 0) + 1;
    for (const t of tags) {
      tagPrimary[t][category] = (tagPrimary[t][category] ?? 0) + 1;
    }
  }

  const prev: StateFile | null = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : null;
  const prevStreak = prev?.streaks ?? {};

  const stats: LabelStat[] = LABELS.map((l: LabelDef) => {
    const cov = coverage[l.slug];
    const share = cov / total;
    // 独立性:标签成员里「已被现有 featured 分类收纳」的占比(横切面 vs 新地盘)
    const primaries = Object.entries(tagPrimary[l.slug]);
    const memberTotal = primaries.reduce((a, [, n]) => a + n, 0);
    const absorbedEntries = primaries.filter(([c]) => c !== 'uncategorized');
    const absorbed = absorbedEntries.reduce((a, [, n]) => a + n, 0);
    const absorbedShare = memberTotal ? absorbed / memberTotal : 0;
    const [absorbedInto] = absorbedEntries.sort((a, b) => b[1] - a[1])[0] ?? [null];

    const { minShare, minCount, minCycles, maxOverlap } = l.promote;
    let streak = prevStreak[l.slug] ?? 0;
    let proposal: 'promote' | 'demote' | null = null;

    if (!l.featured) {
      // 升级候选:量达标 + 大多"无家可归"(未被现有分类收纳)= 是块新地盘
      const qualifies = cov >= minCount && share >= minShare && absorbedShare <= maxOverlap;
      streak = qualifies ? streak + 1 : 0;
      if (streak >= minCycles) proposal = 'promote';
    } else if (l.slug !== 'utility') {
      // 降级候选:量长期失守(utility 是残余 catch-all,豁免降级)
      const failing = cov < minCount && share < minShare;
      streak = failing ? streak + 1 : 0;
      if (streak >= minCycles) proposal = 'demote';
    }

    return { slug: l.slug, featured: l.featured, coverage: cov, share, absorbedShare, absorbedInto, streak, proposal };
  });

  const state: StateFile = {
    updated_at: new Date().toISOString(),
    total,
    streaks: Object.fromEntries(stats.map((s) => [s.slug, s.streak])),
    stats,
  };
  mkdirSync(resolve(process.cwd(), 'catalog/_meta'), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');

  if (process.argv.includes('--json')) { console.log(JSON.stringify(state, null, 2)); return; }

  // 人读报告
  const pct = (n: number) => (n * 100).toFixed(1) + '%';
  console.log(`\ntaxonomy 覆盖(共 ${total} 条)  ·  阈值默认 占比≥5% 且 量≥8 连续3周期,子面集中度≤60%\n`);
  console.log('  标签            featured  覆盖   占比    已收纳(主归)       连续  提案');
  for (const s of stats.sort((a, b) => b.coverage - a.coverage)) {
    const conc = s.featured ? '—' : `${pct(s.absorbedShare)}${s.absorbedInto ? '·' + s.absorbedInto : ''}`;
    const prop = s.proposal ? (s.proposal === 'promote' ? '⬆ 提议升顶级' : '⬇ 提议降标签') : '';
    console.log(
      `  ${(labelBySlug(s.slug)?.label_zh ?? s.slug).padEnd(12)} ${String(s.featured).padEnd(8)} ${String(s.coverage).padStart(4)}  ${pct(s.share).padStart(6)}  ${conc.padEnd(18)} ${String(s.streak).padStart(3)}   ${prop}`,
    );
  }
  const props = stats.filter((s) => s.proposal);
  console.log(props.length
    ? `\n提案 ${props.length} 条 → 需人工在 labels.ts 翻 featured 并走 PR(本 job 不自动改)。`
    : `\n无提案:当前 featured 集稳定。skill-tooling 等标签量未达阈值 → 继续观察。`);
}

main();
