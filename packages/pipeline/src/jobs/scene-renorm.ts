/**
 * scene:renorm —— 场景词归一/季度复核工具,**纯本地不调 LLM**(方案 §07 步骤④)。
 *
 * 补 SCENE_ALIASES 后只需重跑归一,不必为改词表重烧一遍 LLM:
 *   npm run scene:renorm                 # 默认:打印全量场景词频 + 疑似同义簇(供人工挑别名)
 *   npm run scene:renorm -- --top 150    # 只看前 150(默认全打)
 *   npm run scene:renorm -- --apply      # 用当前 SCENE_ALIASES 重归一所有 copy.scene_tags,重跑 lint,写回
 *   npm run scene:renorm -- --apply --dry # 试算不写盘
 *
 * 归一会:合并新别名、去重、剔除命中 labels.ts 的技术词;若某条剔完场景词 <2,lint_pass 相应翻 false(回退)。
 * tagline/fit_line 不受影响(输入没变);content_hash 不动(转述变、采集事实没变)。
 */
import { writeFile } from "node:fs/promises";
import { lintCopy, cleanSceneTags, SCENE_VISIBLE_MIN } from "@skill-store/schemas";
import { loadCatalogEntries, type CatalogEntry } from "../catalog.ts";

const argVal = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

/** 疑似同义簇:按前 2 字分组,露出「市场…」「项目…」「内容…」这类可合并家族。仅提示,合不合并人工定。 */
function clusters(freq: Map<string, number>): [string, [string, number][]][] {
  const groups = new Map<string, [string, number][]>();
  for (const [w, n] of freq) {
    const key = [...w].slice(0, 2).join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push([w, n]);
  }
  return [...groups.entries()]
    .filter(([, ws]) => ws.length >= 2) // 只留有 ≥2 个成员的簇
    .map(([k, ws]) => [k, ws.sort((a, b) => b[1] - a[1])] as [string, [string, number][]])
    .sort((a, b) => b[1].reduce((s, x) => s + x[1], 0) - a[1].reduce((s, x) => s + x[1], 0));
}

async function main() {
  const apply = hasFlag("apply");
  const dry = hasFlag("dry");
  const top = argVal("top") ? Number(argVal("top")) : Infinity;
  const entries = (await loadCatalogEntries()).filter((e) => e.report.copy);

  if (!apply) {
    // ---- 复核模式:打印词频 + 簇 ----
    const freq = new Map<string, number>();
    for (const e of entries) for (const w of e.report.copy!.scene_tags ?? []) freq.set(w, (freq.get(w) ?? 0) + 1);
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    console.log(`场景词复核  条目 ${entries.length}  唯一词 ${freq.size}  (≥${SCENE_VISIBLE_MIN} 者构建期可点)\n`);
    console.log(`词频(top ${top === Infinity ? "全部" : top}):`);
    for (const [w, n] of sorted.slice(0, top === Infinity ? sorted.length : top)) {
      console.log(`  ${String(n).padStart(5)}  ${n >= SCENE_VISIBLE_MIN ? "●" : "·"} ${w}`);
    }
    const cl = clusters(freq);
    console.log(`\n疑似同义簇(${cl.length} 个;同家族里挑一个当规范词,其余写进 SCENE_ALIASES):`);
    for (const [key, ws] of cl.slice(0, 40)) {
      console.log(`  「${key}…」 ${ws.map(([w, n]) => `${w}(${n})`).join("  ")}`);
    }
    return;
  }

  // ---- 应用模式:重归一 + 重跑 lint + 写回 ----
  let changed = 0, flipped = 0, done = 0;
  const before = new Set<string>(), after = new Set<string>();
  for (const e of entries) {
    const c = e.report.copy!;
    for (const w of c.scene_tags ?? []) before.add(w);
    const r = lintCopy({ tagline: c.tagline, scene_tags: c.scene_tags, fit_line: c.fit_line }, e.report.meta.name);
    for (const w of r.cleaned.scene_tags) after.add(w);
    const sceneMoved = JSON.stringify(c.scene_tags) !== JSON.stringify(r.cleaned.scene_tags);
    const lintMoved = c.lint_pass !== r.pass;
    // fit_line 同步(2026-07-11 字段级判罚):被 lint 判罚丢弃的 fit_line 必须一起清掉,
    // 否则 lint_pass 翻 true 后存量的坏 fit_line(如含禁词)会漏上架
    const fitMoved = (c.fit_line ?? undefined) !== r.cleaned.fit_line;
    if (sceneMoved || lintMoved || fitMoved) {
      c.scene_tags = r.cleaned.scene_tags;
      if (fitMoved) { if (r.cleaned.fit_line) c.fit_line = r.cleaned.fit_line; else delete c.fit_line; }
      if (lintMoved) { c.lint_pass = r.pass; flipped++; }
      changed++;
      if (!dry) await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
    }
    if (++done % 1000 === 0) console.log(`  … ${done}/${entries.length}`);
  }
  console.log(
    `\n=== scene:renorm ${dry ? "(dry,未写盘)" : "完成"} ===\n` +
      `重归一 ${changed} 条 · lint_pass 翻转 ${flipped} 条 · 唯一场景词 ${before.size} → ${after.size}`,
  );
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

export type { CatalogEntry };
