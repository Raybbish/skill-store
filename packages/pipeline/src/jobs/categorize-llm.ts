/**
 * categorize:llm —— 用 LLM 语义重判主分类 + 分面标签,治关键词规则的词面误判。
 * 规则引擎(categorize.ts)只看词面;LLM 读语义,是**权威判定**。
 *
 * 分面版(2026-07,ADR 0010 + skill-store-标签设计.html):
 *   - 标签 prompt **由词表生成**(labels.ts 的 definition/正反例),判据只维护一处;
 *   - 按分类分域:模型先定 category,标签只能从该分类适用集(tagsForCategory)里选;
 *   - 每面上限:activity/surface/meta 1 个,language/tech ≤2(真双主力才给第 2 个);
 *   - mcp 与 mcp-server 双命中 → meta 优先(代码层强制,不指望模型自觉);
 *   - 金标门:--canary 跑 fixtures/canary-tags.json,任一易混对精确率 < gate(0.9)→ 退出码 1,
 *     全量重打前必须先过金标(换模型/改 prompt 后同样)。
 *
 * OpenAI 兼容,复用 scanners/llm.ts 的环境变量:
 *   LLM_BASE_URL(默认 https://api.deepseek.com)/ LLM_API_KEY / LLM_MODEL(默认 deepseek-chat)
 *   LLM_MOCK=1 时不调用、返回 uncategorized,用于无 key 跑通管路。
 *   LLM_CONCURRENCY 控制并发(默认 6)。
 *
 * 用法:
 *   npm run categorize:llm -- --canary                    # 金标验证(不写盘)
 *   LLM_MOCK=1 npm run categorize:llm -- --limit 20       # 无 key 测管路
 *   npm run categorize:llm -- --scope uncategorized       # 只判未分类(省钱)
 *   npm run categorize:llm -- --scope all                 # 全量重判(默认,含已分类的以纠错)
 *   npm run categorize:llm -- --dry                       # 只判不写盘
 * 规则:category_locked 不动;隐藏条目(duplicate / frontmatter 不合规)跳过;
 *       单条 LLM 调用失败 → 保留原分类(fail-safe,绝不清空)。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  featuredLabels,
  tagsForCategory,
  tagLabels,
  FACETS,
  type Facet,
  type LabelDef,
} from "@skill-store/schemas";
import { loadCatalogEntries, ROOT, type CatalogEntry } from "../catalog.ts";

const argVal = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const CONCURRENCY = Number(process.env.LLM_CONCURRENCY) || 6;
const TECH_CLUSTER = new Set(["dev", "data-ai", "security", "cloud"]);

/** 分类定义(喂给模型的口径,避免它也照词面猜)。key 必须是 labels.ts 里的 featured slug。 */
const DEFS: Record<string, string> = {
  dev: "软件工程:写代码 / API / SDK / 框架 / 测试 / 重构 / 部署 / CLI / MCP 集成等通用开发",
  media: "媒体生成:视频 / 音频 / 音乐 / 图像 / 动画的生成与编辑",
  design: "设计创意:UI / 视觉 / 品牌视觉 / 排版 / 设计系统",
  docs: "文档办公:生成或处理 Word / PPT / Excel / PDF 等办公文档",
  productivity: "协作生产力:日历 / 会议 / 审批 / 任务协作 / 团队工作流",
  cloud: "云与基础设施:AWS / Azure / GCP / 云资源 / IaC / 自建部署",
  "data-ai": "数据与 AI:数据科学 / 分析 / 机器学习 / LLM / RAG / 数据工程(不是泛指一切含 AI 的东西)",
  writing: "写作内容:博客 / 文案 / 编辑 / 叙事等内容创作(区别于办公文件生成)",
  marketing: "市场营销:SEO / 增长 / 广告 / 社媒 / 内容营销 / GTM",
  science: "科研学术:科学研究 / 学术 / 生物 / 医学 / 论文(市场调研、竞品调研不算)",
  product: "产品管理:PRD / 路线图 / 用户故事 / 需求管理",
  legal: "法律合规:合同 / 合规 / GDPR / 法务",
  finance: "金融财务:交易 / 投资 / 会计 / 税务 / 记账(评估 evaluation 不算)",
  ecommerce: "电商:Shopify / Amazon 卖家运营 / 商品 / 库存 / 结算",
  healthcare: "医疗健康:患者 / 诊断 / 治疗 / 养生健康",
  security: "安全:渗透测试 / 漏洞 / exploit / 恶意软件 / 取证 / 威胁检测 / 红队 / 逆向工程等安全攻防",
  utility: "通用小工具:压缩 / 归档 / 文件搬运等杂项",
};

// ---------- prompt 由词表生成 ----------

const fmtTag = (t: LabelDef): string => {
  let s = `- ${t.slug}: ${t.definition ?? t.label_zh}`;
  if (t.positiveExamples?.length) s += `。正例:${t.positiveExamples.join("、")}`;
  if (t.negativeExamples?.length) s += `。反例:${t.negativeExamples.join("、")}`;
  return s;
};

const FACET_ZH: Record<Facet, string> = { activity: "动作", surface: "形态", language: "语言", tech: "技术栈", meta: "元能力" };

/** 标签清单(分面分组;技术面与通用面分开标注适用范围) */
function buildTagSection(): string {
  const tags = tagLabels();
  const byFacet = (f: Facet, universal: boolean) =>
    tags.filter((t) => t.facet === f && (t.appliesTo === "universal") === universal);
  const parts: string[] = [];
  for (const f of FACETS) {
    const tech = byFacet(f.id, false);
    const uni = byFacet(f.id, true);
    const cap = f.maxPerSkill;
    if (tech.length) parts.push(`【${FACET_ZH[f.id]} ${f.id}(最多 ${cap} 个;仅技术类分类适用)】\n${tech.map(fmtTag).join("\n")}`);
    if (uni.length) parts.push(`【${FACET_ZH[f.id]} ${f.id}·通用(最多 ${cap} 个;所有分类适用)】\n${uni.map(fmtTag).join("\n")}`);
  }
  return parts.join("\n\n");
}

// ---------- 判定后校验(不指望模型自觉,代码层强制) ----------

/** 模型偶发输出「meta: skill-tooling」「#testing」等带前缀形态——归一成纯 slug 再匹配 */
const normSlug = (s: string): string =>
  s.trim().toLowerCase()
    .replace(/^(activity|surface|language|tech|meta)\s*[::]\s*/i, "")
    .replace(/^#/, "")
    .trim();

/** 分域 + 每面上限 + meta 优先。tags 保持模型给出的顺序(它先给的视为更主要)。 */
export function sanitizeTags(raw: unknown, category: string): string[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Map(tagsForCategory(category).map((t) => [t.slug, t]));
  let picked = (raw as unknown[])
    .filter((s): s is string => typeof s === "string")
    .map(normSlug)
    .filter((s) => allowed.has(s));
  // 易混对裁决:meta 优先(mcp-server 压 mcp)
  if (picked.includes("mcp-server")) picked = picked.filter((s) => s !== "mcp");
  // 面内裁决:surface 面 mcp 最具体,与泛化 surface(api/web/cli/mobile)同中时 mcp 胜
  // (否则模型先写 api 时,每面上限会把正确的 mcp 挤掉——2026-07-04 金标发现)
  if (picked.includes("mcp")) picked = picked.filter((s) => s === "mcp" || allowed.get(s)?.facet !== "surface");
  const capLeft = new Map<Facet, number>(FACETS.map((f) => [f.id, f.maxPerSkill]));
  const out: string[] = [];
  for (const slug of picked) {
    const facet = allowed.get(slug)!.facet;
    if (!facet) continue;
    const left = capLeft.get(facet) ?? 0;
    if (left > 0) {
      out.push(slug);
      capLeft.set(facet, left - 1);
    }
  }
  return out;
}

interface LlmVerdict {
  category: string;
  tags: string[];
  confidence: number;
}

async function classify(prompt: string): Promise<LlmVerdict> {
  if (process.env.LLM_MOCK === "1") return { category: "uncategorized", tags: [], confidence: 0 };

  const model = process.env.LLM_MODEL ?? "deepseek-chat";
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.deepseek.com";
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("缺少 LLM_API_KEY(或用 LLM_MOCK=1 测管路)");

  const body = JSON.stringify({
    model,
    temperature: 0,
    response_format: { type: "json_object" }, // 强制合法 JSON(deepseek/openai 兼容),消除解析失败
    messages: [
      { role: "system", content: "你是 Agent Skills 商店的精准分类器。只依据 skill 的真实功能归类,不被表面关键词误导。只输出一个 JSON 对象,不要任何其他文字。" },
      { role: "user", content: prompt },
    ],
  });

  let lastErr = "unreachable";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content ?? "";
      const json = text.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error("输出中未找到 JSON");
      const v = JSON.parse(json) as LlmVerdict;
      if (typeof v.category !== "string") throw new Error("JSON 缺 category 字段");
      return v;
    } catch (e) {
      lastErr = (e as Error).message;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(lastErr);
}

// ---------- prompt 主体 ----------

function buildPrompt(catList: string, tagSection: string, name: string, description: string): string {
  return (
    `可选主分类(只能选一个;都不贴切就选 "uncategorized"):\n${catList}\n\n` +
    `标签按分面(facet)组织,面间正交。选标签的规则:\n` +
    `1. 先定 category,再选标签;\n` +
    `2. 若 category ∈ {dev, data-ai, security, cloud}:所有面均可选;否则**只能**从标注「通用」的面里选;\n` +
    `3. 每面数量上限见各面标注;language/tech 只有真双主力才给第 2 个(如 fullstack 的 ts+python、部署类的 docker+kubernetes),不确定就只给 1 个;\n` +
    `4. mcp 与 mcp-server 同时像时只给 mcp-server(更具体的赢);\n` +
    `5. 宁缺毋滥:不确定的面就不打标签;\n` +
    `6. tags 数组里只写 slug 本身(如 "testing"、"skill-tooling"),**不要**带面名、冒号或 # 前缀;\n` +
    `7. 描述里出现「MCP server」字样**不代表** mcp-server 标签:装依赖/配环境让现成 server 跑起来的 setup → 不打;在应用/agent 代码里包装、调用 MCP 工具(如 from_mcp_tool)→ 打 mcp;只有产出物或工作对象是一个 MCP server 本身(实现/脚手架/调试/部署它)才打 mcp-server。\n\n` +
    `${tagSection}\n\n` +
    `按 skill 的**真实功能**判断,不要被词面误导。易混淆归类口径:\n` +
    `- 埋点/GA/GTM/分析追踪 → marketing;pandas/表格/数据清洗/数据处理 → data-ai\n` +
    `- 项目/issue/看板等流程协作工具 → productivity;PRD/需求/路线图/复盘 → product\n` +
    `- AWS/Azure/GCP/云资源/IaC/架构图/部署基建 → cloud\n` +
    `- 渗透/漏洞/exploit/恶意软件/取证/威胁检测/红队/逆向 → security\n` +
    `- 找供应商/外包/销售线索 → 无贴切分类就给 uncategorized\n` +
    `- 只有真正写代码/框架/测试/SDK/CLI/重构才归 dev;**例外**:造/管/找 skill、command、agent、MCP server 的元工具本身也归 dev\n` +
    `- 元能力(meta)判据只看**工作对象**:对象是 skill/command/agent/MCP 系统本身(创建、导入、打包、审计、发布、发现它们)→ **必须**打对应 meta 标签;对象是业务任务 → 不打,即便它自己是个 skill\n\n` +
    `<SKILL>\nname: ${name}\ndescription: ${description}\n</SKILL>\n\n` +
    `只输出 JSON:{"category":"<slug 或 uncategorized>","tags":["..."],"confidence":0-1}`
  );
}

// ---------- 金标(canary)----------

interface CanaryItem {
  id: string;
  expect: string;
  why?: string;
}
interface CanaryFile {
  pairs: Record<string, { gate: number; items: CanaryItem[] }>;
}

/**
 * 该易混对下,从预测 tags 提取「对上的判定」。
 * 对名即约定:「a-vs-b」= 检查 a、b 两个标签(sanitize 保证互斥);单名 = 检查该标签有无。
 * 加新对只改 fixture,不用动这里。
 */
function predictedForPair(pair: string, tags: string[]): string {
  const parts = pair.split("-vs-");
  // 更长的 slug 先查(「mcp-vs-mcp-server」里 mcp-server 比 mcp 具体)
  for (const p of [...parts].sort((a, b) => b.length - a.length)) if (tags.includes(p)) return p;
  return "none";
}

async function runCanary(catList: string, tagSection: string): Promise<never> {
  const file = JSON.parse(await readFile(join(ROOT, "packages/pipeline/fixtures/canary-tags.json"), "utf8")) as CanaryFile;
  const byId = new Map((await loadCatalogEntries()).map((e) => [e.report.meta.id, e]));
  let allPass = true;

  for (const [pair, { gate, items }] of Object.entries(file.pairs)) {
    let correct = 0;
    const misses: string[] = [];
    // 有界并发跑金标
    let idx = 0;
    const results = new Array<{ pred: string; diag: string }>(items.length);
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
        while (idx < items.length) {
          const i = idx++;
          const it = items[i];
          const e = byId.get(it.id);
          if (!e) {
            results[i] = { pred: "<条目不存在>", diag: "" };
            continue;
          }
          const m = e.report.meta;
          try {
            const v = await classify(buildPrompt(catList, tagSection, m.name, m.description ?? ""));
            const tags = sanitizeTags(v.tags, v.category);
            results[i] = {
              pred: predictedForPair(pair, tags),
              diag: `category=${v.category} raw=[${Array.isArray(v.tags) ? v.tags.join(",") : ""}] 净=[${tags.join(",")}]`,
            };
          } catch (err) {
            results[i] = { pred: `<失败: ${(err as Error).message}>`, diag: "" };
          }
        }
      }),
    );
    for (let i = 0; i < items.length; i++) {
      if (results[i].pred === items[i].expect) correct++;
      else misses.push(`    ✗ ${items[i].id}  期望 ${items[i].expect} 实得 ${results[i].pred}  ⟨${results[i].diag}⟩`);
    }
    const precision = correct / items.length;
    const pass = precision >= gate;
    allPass &&= pass;
    console.log(`\n${pass ? "✓" : "✗"} ${pair}: ${correct}/${items.length} = ${(precision * 100).toFixed(1)}%(门 ${gate * 100}%)`);
    for (const line of misses) console.log(line);
  }

  console.log(allPass ? "\n=== 金标通过,可以全量重打 ===" : "\n=== 金标未过,禁止全量重打:先修 prompt/词表判据再来 ===");
  process.exit(allPass ? 0 : 1);
}

// ---------- 主流程 ----------

async function main() {
  const scope = argVal("scope") ?? "all";
  const limit = argVal("limit") ? Number(argVal("limit")) : Infinity;
  const dry = hasFlag("dry");
  const verbose = hasFlag("verbose");
  const only = argVal("only"); // 只重判当前已是该分类的条目(如 --only dev 给 dev 桶去膨胀)
  const onlyTag = argVal("only-tag"); // 只重判当前带某标签的条目(如 --only-tag scaffolding 给误打标签定向去水)

  const cats = featuredLabels();
  const catSlugs = new Set(cats.map((c) => c.slug));
  const catList = cats.map((c) => `- ${c.slug}: ${DEFS[c.slug] ?? c.label_zh}`).join("\n");
  const tagSection = buildTagSection();

  if (hasFlag("canary")) await runCanary(catList, tagSection);

  const pool = (await loadCatalogEntries()).filter((e) => {
    const m = e.report.meta;
    if (m.category_locked) return false;
    if (m.duplicate_of || e.report.frontmatter_valid === false) return false;
    if (scope === "uncategorized" && m.category && m.category !== "uncategorized") return false;
    if (only && m.category !== only) return false;
    if (onlyTag && !(m.tags ?? []).includes(onlyTag)) return false;
    return true;
  });
  // --shuffle:随机取样(否则 --limit 只取字母序头部,偏向靠前的大仓,样本不具代表性)
  if (hasFlag("shuffle")) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  const entries = pool.slice(0, limit);

  console.log(
    `categorize:llm  scope=${scope}  目标=${entries.length}  并发=${CONCURRENCY}` +
      `${dry ? "  (dry)" : ""}${process.env.LLM_MOCK === "1" ? "  [MOCK]" : ""}`,
  );

  let changed = 0;
  let failed = 0;
  let done = 0;
  const dist: Record<string, number> = {};
  const tagDist: Record<string, number> = {};
  const vrows: string[] = [];

  async function handle(e: CatalogEntry) {
    const m = e.report.meta;
    const prompt = buildPrompt(catList, tagSection, m.name, m.description ?? "");
    try {
      const v = await classify(prompt);
      const category = catSlugs.has(v.category) ? v.category : "uncategorized";
      const tags = sanitizeTags(v.tags, category);
      dist[category] = (dist[category] ?? 0) + 1;
      for (const t of tags) tagDist[t] = (tagDist[t] ?? 0) + 1;

      const oldCat = m.category ?? null;
      if (verbose) vrows.push(`  ${category.padEnd(12)} ⟵ ${(oldCat ?? "uncategorized").padEnd(13)} ${m.id}  [${tags.join(",")}]`);
      const oldTags = JSON.stringify(m.tags ?? []);
      if (oldCat !== category || oldTags !== JSON.stringify(tags)) {
        changed++;
        m.category = category;
        m.tags = tags;
        if (!dry) await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
      }
    } catch (err) {
      failed++;
      if (failed <= 5) console.warn(`  ⚠ ${m.id}: ${(err as Error).message}`);
    }
    if (++done % 200 === 0) console.log(`  … ${done}/${entries.length}`);
  }

  // 简单并发池:CONCURRENCY 个 worker 争抢同一游标
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
      while (idx < entries.length) await handle(entries[idx++]);
    }),
  );

  console.log(`\n=== categorize:llm ${dry ? "(dry,未写盘)" : "完成"} ===`);
  console.log(`处理 ${done} · 变更 ${changed} · 失败(保留原分类) ${failed}`);
  console.log("LLM 判定主分类分布:");
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  console.log("分面标签分布(top 20):");
  for (const [k, v] of Object.entries(tagDist).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${String(v).padStart(5)}  ${k}`);
  }
  if (verbose) {
    console.log("\n逐条(new ⟵ old):");
    for (const r of vrows.sort()) console.log(r);
  }
}

// 守卫:仅直接执行时跑 main(sanitizeTags 被外部 import 时不触发全量流程)
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
