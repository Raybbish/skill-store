/**
 * 构建期索引生成(ADR 0007 · P0):catalog → public/idx/ 静态派生索引。
 *
 *   idx/meta.json     total/pages + 分类·标签·桶内细分计数(货架口径:主分类或标签命中)
 *   idx/pages/pN.json 默认「热门」视图分片,每片 PAGE_SIZE(30)张瘦卡,已套 per-repo cap
 *   idx/docs.json     全量瘦卡(纯热门序、未 cap),客户端筛选/搜索懒加载用
 *
 * 跑法:npm run web:index(根目录)或 npm run index -w @skill-store/web;
 * dev/build 经 predev/prebuild 自动执行。**必须以 packages/web 为 cwd**(data.ts 按 cwd 找 catalog)。
 * 产物是派生物,不进 git(见 .gitignore);搜索/浏览查它,catalog 仍是唯一事实源。
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { allSkills } from "../lib/data";
import { PAGE_SIZE, toCard, toWire, type CardVerdict, type IdxMeta, type Pack, type SkillCard } from "../lib/store";
import { batchGetVerdicts, displayReady } from "@skill-store/verdicts";
import { applyRepoCap, byPopularity } from "../lib/skill-utils";
import { featuredLabels, tagLabels, SCENE_VISIBLE_MIN } from "@skill-store/schemas";

const t0 = Date.now();
const OUT = join(process.cwd(), "public/idx");

const skills = allSkills();
if (!skills.length) {
  console.error("[build-index] catalog 读到 0 条 —— cwd 必须是 packages/web(经 npm run index -w 执行)。");
  process.exit(1);
}

// 收录时间事实源 = signals.first_seen_at(物化缓存,ADR 0016);
// git 遍历只作缺失回退(存量已回填,理论上仅覆盖回填前的极少漏网)。
function gitAddedAt(): Map<string, number> {
  const added = new Map<string, number>();
  try {
    const out = execSync("git log --diff-filter=A --format=%x01%ct --name-only -- catalog/skills", {
      cwd: join(process.cwd(), "../.."), encoding: "utf8", maxBuffer: 512 * 1024 * 1024,
    });
    let ts = 0;
    for (const line of out.split("\n")) {
      if (line.charCodeAt(0) === 1) { ts = parseInt(line.slice(1), 10); continue; }
      const m = line.match(/^catalog\/skills\/(.+)\/skill-report\.json$/);
      if (m && !added.has(m[1])) added.set(m[1], ts);
    }
  } catch (e) {
    console.warn("[build-index] git 回退不可用(浅克隆/无 git?),缺 first_seen_at 的条目将无收录时间:", (e as Error).message);
  }
  return added;
}
const addedAt = new Map<string, number>();
{
  let missing = 0;
  for (const s of skills) {
    const t = s.firstSeenAt ? Math.floor(Date.parse(s.firstSeenAt) / 1000) : NaN;
    if (Number.isFinite(t)) addedAt.set(s.id, t);
    else missing++;
  }
  if (missing > 0) {
    const git = gitAddedAt();
    for (const s of skills) if (!addedAt.has(s.id) && git.has(s.id)) addedAt.set(s.id, git.get(s.id)!);
    console.warn(`[build-index] ${missing} 条缺 signals.first_seen_at,git 回退补到 ${addedAt.size} 条`);
  }
}

// 纯热门序全量瘦卡(docs.json);分片视图在此之上套 per-repo cap
const docs = [...skills].sort(byPopularity).map((s) => {
  const c = toCard(s);
  const t = addedAt.get(c.id);
  return t ? { ...c, addedAt: t } : c;
});

// 插拔点②(ADR 0012 步骤④):TRUST_DISPLAY=1 且 policy 定稿时才 join verdict 到瘦卡;
// 默认 off——瘦卡零新增字节,TrustBadge 恒 null,货架与今天完全一致。
if (displayReady()) {
  const byHash = new Map(skills.map((s) => [s.id, s.contentHash ?? ""]));
  const vmap = await batchGetVerdicts(skills.map((s) => ({ skill_id: s.id, content_hash: s.contentHash ?? "" })));
  let joined = 0;
  for (const c of docs) {
    const v = vmap.get(c.id);
    if (!v || v.subject.content_hash !== byHash.get(c.id)) continue; // 判定锚内容,hash 不符不展示
    c.verdict = { status: v.status, policy: v.scanner.policy, factors: v.factors as CardVerdict["factors"] };
    joined++;
  }
  console.log(`[build-index] TRUST_DISPLAY=on · verdict join: ${joined}/${docs.length}`);
}

// 场景词可见性(§02/§05):全局词频 ≥ SCENE_VISIBLE_MIN 的升为可点 chip(留在 scene),
// 其余降为搜索召回串(skw,UI 不显示)。天然保证「点 chip 出去 ≥ 阈值 条」的红线,无需额外逻辑。
const sceneFreq: Record<string, number> = {};
for (const c of docs) for (const w of c.scene ?? []) sceneFreq[w] = (sceneFreq[w] ?? 0) + 1;
const sceneVocab = Object.entries(sceneFreq)
  .filter(([, n]) => n >= SCENE_VISIBLE_MIN)
  .sort((a, b) => b[1] - a[1])
  .map(([w]) => w);
const visibleScene = new Set(sceneVocab);
for (const c of docs) {
  if (!c.scene?.length) continue;
  const vis = c.scene.filter((w) => visibleScene.has(w));
  const hid = c.scene.filter((w) => !visibleScene.has(w));
  if (vis.length) c.scene = vis;
  else delete c.scene;
  if (hid.length) c.skw = hid.join(" ");
}

const shelf = applyRepoCap(docs);

// 计数(与 matchFilters/货架口径一致:分类=主分类命中;标签=tags 命中)
const cats: Record<string, number> = {};
const tags: Record<string, number> = {};
const catTag: Record<string, Record<string, number>> = {};
const tagSlugs = tagLabels().map((l) => l.slug);
for (const l of featuredLabels()) {
  const members = docs.filter((c) => c.category === l.slug || (c.tags ?? []).includes(l.slug));
  cats[l.slug] = members.length;
  const inner: Record<string, number> = {};
  for (const t of tagSlugs) {
    const n = members.filter((c) => (c.tags ?? []).includes(t)).length;
    if (n > 0) inner[t] = n;
  }
  if (Object.keys(inner).length) catTag[l.slug] = inner;
}
for (const t of tagSlugs) {
  const n = docs.filter((c) => c.category === t || (c.tags ?? []).includes(t)).length;
  if (n > 0) tags[t] = n;
}

// 落盘(rm 失败不致命:沙箱挂载盘禁 unlink 时直接覆盖写)
try { rmSync(OUT, { recursive: true, force: true }); } catch { /* 覆盖写兜底 */ }
mkdirSync(join(OUT, "pages"), { recursive: true });

// 落盘一律线格式(WireCard,去可派生字段;读侧统一水合)——载荷工程,见 store.ts toWire
const pages = Math.max(1, Math.ceil(shelf.length / PAGE_SIZE));
for (let p = 1; p <= pages; p++) {
  writeFileSync(join(OUT, "pages", `p${p}.json`), JSON.stringify(shelf.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE).map(toWire)));
}
const meta: IdxMeta = {
  generatedAt: new Date().toISOString(),
  total: docs.length, pages, size: PAGE_SIZE,
  cats, tags, catTag,
  ...(sceneVocab.length ? { sceneVocab } : {}),
};
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));
writeFileSync(join(OUT, "docs.json"), JSON.stringify(docs.map(toWire)));

// 新上架(榜单「今日」):按收录「日」降序(与 ChartsView 的 Asia/Shanghai 日界对齐)。
// docs 已按 byPopularity(归一 stars 主键)排好;JS 稳定排序下,只按「日」分桶即保住同日内的
// 人气序 —— 与热门/浏览同一口径,不依赖第三方 installs。同天条目 first_seen_at 只差几秒,
// 若按秒级降序会退化成管线处理顺序(看着随机),故按日分桶。取前 100。
const cstDay = (sec: number) => Math.floor((sec + 8 * 3600) / 86400); // addedAt 是 unix 秒,+8h 对齐东八区日界
const fresh = docs
  .filter((c) => c.addedAt)
  .sort((a, b) => cstDay(b.addedAt!) - cstDay(a.addedAt!))
  .slice(0, 100);
writeFileSync(join(OUT, "new.json"), JSON.stringify(fresh.map(toWire)));

// 商店周报(/changelog):自动统计行「本周 +N 条」(自最近周一 00:00 的收录数)+ 手写条目(catalog/changelog.json 事实源)
const weekStart = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 回退到本周一
  return Math.floor(d.getTime() / 1000);
})();
const weekAdded = docs.filter((c) => c.addedAt && c.addedAt >= weekStart).length;
let clEntries: unknown[] = [];
try {
  const raw = JSON.parse(readFileSync(join(process.cwd(), "../../catalog/changelog.json"), "utf8"));
  if (Array.isArray(raw?.entries)) clEntries = raw.entries;
} catch { /* 无手写条目也无妨,只出统计行 */ }
writeFileSync(join(OUT, "changelog.json"), JSON.stringify({ generatedAt: meta.generatedAt, weekAdded, entries: clEntries }));
console.log(`[build-index] changelog: 本周 +${weekAdded} · 手写条目 ${clEntries.length}`);

// 场景包:catalog/packs/*.json → 成员从瘦卡池解析;成员缺失 → 整包跳过(包=放心一键装的承诺)
const byId = new Map<string, SkillCard>(docs.map((c) => [c.id, c]));
const packs: Pack[] = [];
try {
  const PACKS = join(process.cwd(), "../../catalog/packs");
  for (const f of readdirSync(PACKS).sort()) {
    if (!f.endsWith(".json")) continue;
    const p = JSON.parse(readFileSync(join(PACKS, f), "utf8"));
    const members = (p.skills as string[]).map((id) => byId.get(id)).filter((c): c is SkillCard => Boolean(c));
    if (members.length !== p.skills.length) {
      // 成员不在瘦卡池 = 退市(ADR 0020)/ 不合规 / 改名——点名到 id,便于换新名或摘成员
      const missing = (p.skills as string[]).filter((id) => !byId.get(id));
      console.warn(`[build-index] pack ${p.id} 成员缺失,跳过: ${missing.join(", ")}(可能已退市/改名,查 catalog 对应条目)`);
      continue;
    }
    packs.push({
      id: p.id, emoji: p.emoji, tile: p.tile, title: p.title, tagline: p.tagline, members,
      ...(p.title_en ? { titleEn: p.title_en } : {}), ...(p.tagline_en ? { taglineEn: p.tagline_en } : {}),
      // 编辑手记透传(活人感 P0):catalog 侧 editor_note{text,author,date},缺省不带
      ...(p.editor_note ? { editorNote: p.editor_note } : {}),
    });
  }
} catch { /* packs 目录可缺省 */ }
writeFileSync(join(OUT, "packs.json"), JSON.stringify(packs.map((p) => ({ ...p, members: p.members.map(toWire) }))));

const kb = (f: string) => `${Math.round(statSync(join(OUT, f)).size / 1024)}KB`;
console.log(
  `[build-index] ${docs.length} 条 → ${pages} 片 × ${PAGE_SIZE} · meta ${kb("meta.json")} · docs ${kb("docs.json")} · p1 ${kb("pages/p1.json")} · 新上架 ${fresh.length} · 包 ${packs.length} · 可见场景词 ${sceneVocab.length} · ${Date.now() - t0}ms`,
);
