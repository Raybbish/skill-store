/**
 * howto:llm —— 「怎么用」板块生成(ADR 0025):SKILL.md 正文 → 双语三段事实性转述。
 *
 * 与转述层(categorize:llm 的微文案)同哲学、同环境变量、同锚:
 *   - 中英**同一次调用**产出(ADR 0022:商店的话跟语言走;比分两批省一半);
 *   - 锚 meta.content_hash:不一致 = 过期,下次重算;实质未变不重写(免时间戳 churn);
 *   - 输入是 SKILL.md **正文**(区别于微文案只吃 name+description)——磁盘优先
 *     (mirror/SKILL.md → skill.md 快照),都没有时从上游 raw 临时拉取(pinned only,
 *     用完即弃不落盘:证不宽松的正文不进公开 catalog,ADR 0025 转载红线);
 *   - author 稿(认领后)不被覆盖——source=author 且锚新鲜的条目跳过。
 *
 * OpenAI 兼容,环境变量同 categorize:llm:
 *   LLM_BASE_URL / LLM_API_KEY / LLM_MODEL / LLM_CONCURRENCY;LLM_MOCK=1 测管路不写盘。
 *
 * 用法:
 *   npm run howto:llm -- --scope hot            # 场景包成员 ∪ 人气 top(默认 1000)(S1)
 *   npm run howto:llm -- --scope all            # 全量补齐(S2,分批跑)
 *   npm run howto:llm -- --scope missing-en     # 只补「zh 新鲜可用但缺英文」的存量(没拿到英文不动旧块)
 *   npm run howto:llm -- --top 500              # 调热门集大小
 *   npm run howto:llm -- --limit 20 --dry       # 试跑不写盘
 *   npm run howto:llm -- --verbose              # 逐条打印产出
 * 规则:拷贝 / frontmatter 不合规 / 退市条目跳过;单条失败保留旧值(fail-safe)。
 */
import { writeFile } from "node:fs/promises";
import { BANNED_WORDS, type SkillHowto, type HowtoSay } from "@skill-store/schemas";
import { loadCatalogEntries, type CatalogEntry } from "../catalog.ts";
import { readSkillMdFromDisk, fetchSkillMd } from "../skillmd.ts";
import { hotIds } from "../hot.ts";

const argVal = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const CONCURRENCY = Number(process.env.LLM_CONCURRENCY) || 6;
const MODEL = process.env.LLM_MODEL ?? "deepseek-chat";

/** 正文截断:超长部分对「怎么用」三段的边际信息趋零,控输入成本(≈4k tokens) */
const BODY_MAX_CHARS = 14000;

// ---------- prompt ----------

const SYSTEM =
  "你是 Agent Skills 商店的店员,负责把技能的 SKILL.md 原文转述成给普通用户看的「怎么用」板块。" +
  "只依据原文写事实,不脑补效果、不替作者吹。只输出一个 JSON 对象,不要任何其他文字。";

function buildPrompt(name: string, description: string, body: string): string {
  const truncated = body.length > BODY_MAX_CHARS;
  return (
    `下面是技能「${name}」的 SKILL.md 原文${truncated ? "(超长已截断,按已见部分写)" : ""}。` +
    `据此输出六个字段,全部**事实性**描述——只转述原文里确凿的行为,禁止营销语气与这些水词:${BANNED_WORDS.join("、")}(「最佳实践」是技术名词可以用;其他场合换词,如「最佳结果」→「头部结果」)。\n` +
    `**语言规则:what/when/say 三个字段必须用中文写**(触发词、模型名、专有名词可保留英文);英文只写进 *_en 字段。\n` +
    `- what:装上后 Claude 的行为会怎么变(它做什么、产出什么)。1~3 句,**≤120 字硬上限**——超了就砍举例,不砍主句。写给完全不懂技术的人。\n` +
    `- when:什么时候会触发/接管。原文写明触发条件(如 description 的 use when、硬性门槛)就如实转述;没写就按正文流程推断最典型的进入时机。1~2 句,**≤100 字**。**任何列举(触发词、功能、平台)最多 3 项,其余用「等」收,超过直接判废**。反例(判废):「当你说出“A”、“B”、“C”、“D”、“E”、“F”时触发」;正例:「当你提到 “A”、“B” 等关键词,或要求做 X 时触发」。\n` +
    `- say:**必须给满 2~3 条**用户装好后可以**直接对 Claude 说的话**(中文示例话术),每条 ≤40 字,必须贴合该技能的真实入口(它管什么就说什么,不要通用寒暄);想不出第二种用法就换参数/换对象再造一条。note 可选,一短句(≤30 字)说明这么说之后会发生什么。\n` +
    `- 英文同构(自然转述不是逐字直译,**宁短勿超**):what_en ≤240 chars,when_en ≤200 chars,say_en 与 say 数量对应(each text ≤80 chars,note ≤60 chars)。英文字段是必填项,不要省略。\n` +
    `信息不足宁可短,不编造。\n\n` +
    `<SKILL name="${name}" description=${JSON.stringify(description)}>\n${body.slice(0, BODY_MAX_CHARS)}\n</SKILL>\n\n` +
    `只输出 JSON:{"what":"...","when":"...","say":[{"text":"...","note":"..."}],` +
    `"what_en":"...","when_en":"...","say_en":[{"text":"...","note":"..."}]}`
  );
}

interface LlmHowto {
  what?: unknown;
  when?: unknown;
  say?: unknown;
  what_en?: unknown;
  when_en?: unknown;
  say_en?: unknown;
}

async function callLlm(prompt: string): Promise<LlmHowto | null> {
  if (process.env.LLM_MOCK === "1") return null; // 管路测试:不调用、不写盘

  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.deepseek.com";
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) throw new Error("缺少 LLM_API_KEY(或用 LLM_MOCK=1 测管路)");

  const body = JSON.stringify({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
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
      return JSON.parse(json) as LlmHowto;
    } catch (e) {
      lastErr = (e as Error).message;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(lastErr);
}

// ---------- lint(代码层强制,不指望模型自觉;判据与 schemas 注释同口径) ----------

/**
 * 禁用词白名单:技术名词整体豁免,先剥再查(2026-07-13 首批抽读发现
 * 「最佳实践/best practices」撞禁用词「最佳/best-in-class」误伤两条)。
 * 只在 howto 侧豁免——tagline 是营销位,微文案 lint 的严口径不动。
 */
const ALLOW_PHRASES = ["最佳实践", "best practices", "best practice"];
const hasBanned = (s: string): boolean => {
  let t = s.toLowerCase();
  for (const p of ALLOW_PHRASES) t = t.split(p.toLowerCase()).join("");
  return BANNED_WORDS.some((w) => t.includes(w.toLowerCase()));
};

function cleanSay(raw: unknown, textMax: number, noteMax: number): HowtoSay[] {
  if (!Array.isArray(raw)) return [];
  const out: HowtoSay[] = [];
  for (const it of raw) {
    if (typeof it !== "object" || it === null) continue;
    const rec = it as Partial<HowtoSay>;
    const text = typeof rec.text === "string" ? rec.text.trim() : "";
    if (!text || text.length > textMax) continue;
    const note = typeof rec.note === "string" ? rec.note.trim() : "";
    out.push(note && note.length <= noteMax ? { text, note } : { text });
    if (out.length === 3) break;
  }
  return out;
}

/**
 * zh 三段是主字段:what/when 缺失超限带水词或语言跑偏、say 为空 → lint_pass=false(照存便于排查,
 * 前端不展示转述段);en 是补充:不合格丢英文字段(前端英文态回退不显示),不拉低 lint_pass。
 * 判据沿革(2026-07-13 两批抽读):
 *   - say ≥2 放宽为 ≥1:单入口模型类技能(kling/wan)真只有一种开口方式,一条也有价值,prompt 仍要求 2~3;
 *   - when 帽 110→120(帽比 prompt 100 宽 20%,与英文侧同哲学):贴着设导致小幅超限整条判废;
 *   - 新增 CJK 闸:zh 字段必须含中文(抽读发现 seo-audit 整条 zh 字段输出英文)。
 * ⚠ temperature=0:同 prompt 同输入输出确定,顽固 fail 条目靠改 prompt/判据,纯重跑无效。
 */
const hasCjk = (s: string): boolean => /[一-鿿]/.test(s);

function buildHowto(v: LlmHowto, contentHash: string): SkillHowto | null {
  const what = typeof v.what === "string" ? v.what.trim() : "";
  const when = typeof v.when === "string" ? v.when.trim() : "";
  if (!what && !when) return null; // 模型整体没产出:不写空壳
  const say = cleanSay(v.say, 40, 30);
  // zh 帽 = prompt 要求 +25%(what 120→150,when 100→125),与英文侧同哲学:
  // 帽贴着 prompt 设会把贴线小超(第三批:kling when 123、seo-google what 136)整条判废,
  // 帽管的是「离谱」,措辞纪律交给 prompt。
  const pass =
    what.length > 0 && what.length <= 150 && !hasBanned(what) && hasCjk(what) &&
    when.length > 0 && when.length <= 125 && !hasBanned(when) && hasCjk(when) &&
    say.length >= 1;

  const out: SkillHowto = {
    what,
    when,
    say,
    source: "llm",
    content_hash: contentHash,
    model: MODEL,
    generated_at: new Date().toISOString(),
    lint_pass: pass,
  };
  const whatEn = typeof v.what_en === "string" ? v.what_en.trim() : "";
  const whenEn = typeof v.when_en === "string" ? v.when_en.trim() : "";
  const sayEn = cleanSay(v.say_en, 100, 80);
  // 英文三件齐才挂(半套英文比没有更糟:界面会出现中英夹杂的板块)。
  // 帽比 prompt 要求宽 ~25%(2026-07-13 首批抽读:帽贴着要求设,模型小幅超限即整组丢,4/20 缺英文)
  if (whatEn && whatEn.length <= 300 && whenEn && whenEn.length <= 240 && sayEn.length >= 2) {
    out.what_en = whatEn;
    out.when_en = whenEn;
    out.say_en = sayEn;
  }
  return out;
}

/** 实质比较(忽略 generated_at/model):避免重跑因时间戳 churn 全量重写 */
function materiallyEqual(a: SkillHowto | null | undefined, b: SkillHowto | null): boolean {
  if (!a || !b) return a == null && b == null;
  return (
    a.what === b.what &&
    a.when === b.when &&
    a.what_en === b.what_en &&
    a.when_en === b.when_en &&
    a.source === b.source &&
    a.content_hash === b.content_hash &&
    a.lint_pass === b.lint_pass &&
    JSON.stringify(a.say) === JSON.stringify(b.say) &&
    JSON.stringify(a.say_en) === JSON.stringify(b.say_en)
  );
}

// ---------- 主流程 ----------

async function main() {
  const scope = argVal("scope") ?? "hot";
  const top = argVal("top") ? Number(argVal("top")) : 1000;
  const limit = argVal("limit") ? Number(argVal("limit")) : Infinity;
  const dry = hasFlag("dry");
  const verbose = hasFlag("verbose");

  const entries = await loadCatalogEntries();
  const shelf = entries.filter((e) => {
    const m = e.report.meta;
    return !m.duplicate_of && !m.delisted_at && e.report.frontmatter_valid !== false;
  });
  // 新鲜度闸:锚新鲜且 lint 过的跳过;author 稿(认领改写)只要锚新鲜就跳过,机器永不覆盖人
  const stale = shelf.filter((e) => {
    const h = e.report.howto;
    if (!h) return true;
    if (h.content_hash !== e.report.meta.content_hash) return true;
    if (h.source === "author") return false;
    return h.lint_pass !== true;
  });
  // missing-en(同 categorize:llm 的 missing-en 哲学):只补「zh 新鲜可用但缺英文」的存量,
  // 同一次调用重产中英两份;写盘闸在 handle 里——这次没拿到英文就保留旧块,zh 成果不因补英文失败被刷新
  const missingEn = shelf.filter((e) => {
    const h = e.report.howto;
    return !!h && h.content_hash === e.report.meta.content_hash && h.lint_pass === true && h.source === "llm" && !h.what_en;
  });

  let pool = scope === "missing-en" ? missingEn : stale;
  if (scope === "hot") {
    const hot = await hotIds(shelf, top);
    pool = stale.filter((e) => hot.has(e.report.meta.id));
  }
  const targets = pool.slice(0, limit);

  console.log(
    `howto:llm  scope=${scope}${scope === "hot" ? `(top=${top})` : ""}  待生成 ${stale.length} · 本次目标 ${targets.length}` +
      `  并发=${CONCURRENCY}${dry ? "  (dry)" : ""}${process.env.LLM_MOCK === "1" ? "  [MOCK]" : ""}`,
  );

  let written = 0, lintFail = 0, noBody = 0, failed = 0, nullOut = 0, done = 0;
  const vrows: string[] = [];

  async function handle(e: CatalogEntry) {
    const m = e.report.meta;
    try {
      // 正文:磁盘(mirror → 快照)优先;没有则上游 raw 临时拉取(pinned only,不落盘)
      let body = await readSkillMdFromDisk(m.id);
      if (body == null) {
        const got = await fetchSkillMd(e.report);
        body = got?.pinned ? got.text : null;
      }
      if (body == null) {
        noBody++;
        return;
      }
      const v = await callLlm(buildPrompt(m.name, m.description ?? "", body));
      if (v == null) {
        nullOut++; // MOCK
        return;
      }
      const next = buildHowto(v, m.content_hash);
      if (next == null) {
        nullOut++;
        return;
      }
      // missing-en 写盘闸:这次没拿到英文 → 保留旧块(中文成果不因补英文的失败被刷新)
      if (scope === "missing-en" && !next.what_en) {
        nullOut++;
        return;
      }
      if (!next.lint_pass) lintFail++;
      if (verbose)
        vrows.push(
          `  ${next.lint_pass ? "✓" : "✗"} ${m.id}\n      what«${next.what}»\n      when«${next.when}»\n      say:${next.say.map((s) => `「${s.text}」`).join(" ")}${next.what_en ? "" : "  ⟨缺英文⟩"}`,
        );
      if (!materiallyEqual(e.report.howto, next)) {
        e.report.howto = next;
        if (!dry) await writeFile(e.path, JSON.stringify(e.report, null, 2) + "\n");
        written++;
      }
    } catch (err) {
      failed++;
      if (failed <= 5) console.warn(`  ⚠ ${m.id}: ${(err as Error).message}`);
    } finally {
      if (++done % 100 === 0) console.log(`  … ${done}/${targets.length}(写入 ${written})`);
    }
  }

  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
      while (idx < targets.length) await handle(targets[idx++]);
    }),
  );

  console.log(`\n=== howto:llm ${dry ? "(dry,未写盘)" : "完成"} ===`);
  console.log(
    `处理 ${done} · 写入 ${written}(其中 lint 未过照存 ${lintFail}) · 无正文跳过 ${noBody} · 无产出 ${nullOut} · 失败(保留旧值) ${failed}`,
  );
  if (verbose && vrows.length) {
    console.log("\n逐条:");
    for (const r of vrows) console.log(r);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
