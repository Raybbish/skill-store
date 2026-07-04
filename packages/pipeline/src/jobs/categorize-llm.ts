/**
 * categorize:llm —— 用 LLM 语义重判主分类 + 标签,治关键词规则的词面误判。
 * 规则引擎(categorize.ts)只看词面:会把 "evaluation harness" 当 finance、"SEO data" 当 data-ai。
 * LLM 读语义,精度高很多。OpenAI 兼容,复用 scanners/llm.ts 的环境变量:
 *   LLM_BASE_URL(默认 https://api.deepseek.com)/ LLM_API_KEY / LLM_MODEL(默认 deepseek-chat)
 *   LLM_MOCK=1 时不调用、返回 uncategorized,用于无 key 跑通管路。
 *   LLM_CONCURRENCY 控制并发(默认 6)。
 *
 * 用法:
 *   LLM_MOCK=1 npm run categorize:llm -- --limit 20     # 无 key 测管路
 *   npm run categorize:llm -- --scope uncategorized      # 只判未分类(省钱)
 *   npm run categorize:llm -- --scope all                # 全量重判(默认,含已分类的以纠错)
 *   npm run categorize:llm -- --dry                      # 只判不写盘
 * 规则:category_locked 不动;隐藏条目(duplicate / frontmatter 不合规)跳过;
 *       单条 LLM 调用失败 → 保留原分类(fail-safe,绝不清空)。
 */
import { writeFile } from "node:fs/promises";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import { loadCatalogEntries, type CatalogEntry } from "../catalog.ts";

const argVal = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const CONCURRENCY = Number(process.env.LLM_CONCURRENCY) || 6;

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

async function main() {
  const scope = argVal("scope") ?? "all";
  const limit = argVal("limit") ? Number(argVal("limit")) : Infinity;
  const dry = hasFlag("dry");
  const verbose = hasFlag("verbose");
  const only = argVal("only"); // 只重判当前已是该分类的条目(如 --only dev 给 dev 桶去膨胀)

  const cats = featuredLabels();
  const catSlugs = new Set(cats.map((c) => c.slug));
  const tagSlugs = new Set(tagLabels().map((t) => t.slug));
  const catList = cats.map((c) => `- ${c.slug}: ${DEFS[c.slug] ?? c.label_zh}`).join("\n");
  const tagListStr = [...tagSlugs].join(", ");

  const pool = (await loadCatalogEntries()).filter((e) => {
    const m = e.report.meta;
    if (m.category_locked) return false;
    if (m.duplicate_of || e.report.frontmatter_valid === false) return false;
    if (scope === "uncategorized" && m.category && m.category !== "uncategorized") return false;
    if (only && m.category !== only) return false;
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
  const vrows: string[] = [];

  async function handle(e: CatalogEntry) {
    const m = e.report.meta;
    const prompt =
      `可选主分类(只能选一个;都不贴切就选 "uncategorized"):\n${catList}\n\n` +
      `可选标签(0 个或多个,只能从中选):${tagListStr}\n\n` +
      `按 skill 的**真实功能**判断,不要被词面误导。易混淆归类口径:\n` +
      `- 埋点/GA/GTM/分析追踪 → marketing;pandas/表格/数据清洗/数据处理 → data-ai\n` +
      `- 项目/issue/看板等流程协作工具 → productivity;PRD/需求/路线图/复盘 → product\n` +
      `- AWS/Azure/GCP/云资源/IaC/架构图/部署基建 → cloud\n` +
      `- 渗透/漏洞/exploit/恶意软件/取证/威胁检测/红队/逆向 → security\n` +
      `- 找供应商/外包/销售线索 → 无贴切分类就给 uncategorized\n` +
      `- 只有真正写代码/框架/测试/SDK/CLI/重构才归 dev\n\n` +
      `<SKILL>\nname: ${m.name}\ndescription: ${m.description ?? ""}\n</SKILL>\n\n` +
      `只输出 JSON:{"category":"<slug 或 uncategorized>","tags":["..."],"confidence":0-1}`;
    try {
      const v = await classify(prompt);
      const category = catSlugs.has(v.category) ? v.category : "uncategorized";
      const tags = Array.isArray(v.tags) ? v.tags.filter((t) => tagSlugs.has(t)) : [];
      dist[category] = (dist[category] ?? 0) + 1;

      const oldCat = m.category ?? null;
      if (verbose) vrows.push(`  ${category.padEnd(12)} ⟵ ${(oldCat ?? "uncategorized").padEnd(13)} ${m.id}`);
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
  if (verbose) {
    console.log("\n逐条(new ⟵ old):");
    for (const r of vrows.sort()) console.log(r);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
