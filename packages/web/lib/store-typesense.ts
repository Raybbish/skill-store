/**
 * TypesenseStore —— SkillStore 的 Typesense 适配(ADR 0004/0007 的「换 adapter 不动接口」)。
 *
 * P2(ADR 0018):三态(默认视图 / 纯筛选 / 带词搜索)+ getSkill 全走 Typesense,
 * 浏览器不再 fetch docs.json;Typesense 不可达即抛错(fail-open 已下线,见 ADR 0018 放弃项)。
 * 仅当 env 未配 Typesense 时,createStore 回落纯 StaticStore(本地 docs 实现保留为降级档)。
 *
 * 配置:NEXT_PUBLIC_TYPESENSE_URL + NEXT_PUBLIC_TYPESENSE_SEARCH_KEY(未设 = 纯 StaticStore)。
 * 生产环境务必用 search-only scoped key,admin key 只进推送脚本——因此本文件所有请求
 * (含 getSkill)只打 search 端点,不用需要 documents:get 权限的文档直取端点。
 */
import {
  PAGE_SIZE, StaticStore, hydrateCard, queryTerms,
  type SearchFilters, type SearchResult, type SkillCard, type SkillStore, type WireCard,
} from "./store";

/** 推送脚本与适配器共享的文档形状:线格式瘦卡 + 检索辅助字段 */
export type TsDoc = WireCard & {
  /** Typesense 文档 id(id 含 "/",按 ~ 转义);真实 id 在 sid */
  id: string;
  sid: string;
  /** owner/repo(repo 精确筛选用) */
  repoFull: string;
  /** 热门序权重(docs.json 序反转,越大越热);默认排序键 */
  pop: number;
  /** 发布者(线格式里可省略,推送时补齐,搜索 query_by 需要) */
  publisher: string;
  /** per-repo cap 平价旗标:同仓 pop 序前 3 席=0(留头),其余=1(沉底);无词浏览 sort 第一键 */
  cap_overflow: number;
};

export const TS_COLLECTION = "skills";
/** 与 matchScore 的层级一致:name > id > scene > tags > tagline > description/publisher > skw */
export const TS_QUERY_BY = "name,sid,scene,tags,tagline,description,publisher,skw,taglineEn,sceneEn"; // 英文召回(ADR 0022)
export const TS_QUERY_WEIGHTS = "10,6,5,4,3,2,2,1,3,5";

function filterBy(f: SearchFilters): string {
  const parts: string[] = [];
  if (f.cat) parts.push(`category:=${f.cat}`);
  if (f.tag) parts.push(`tags:=${f.tag}`);
  for (const t of f.tags ?? []) parts.push(`tags:=${t}`);
  if (f.evaledOnly) parts.push(`ev:>=0`);
  if (f.publisher) parts.push(`publisher:=${f.publisher}`);
  if (f.repo) parts.push(`repoFull:=${f.repo}`);
  return parts.join(" && ");
}

/** Typesense 文档 → SkillCard:剥检索辅助字段(sid/repoFull/pop/cap_overflow),真实 id 用 sid */
function tsDocToCard(d: TsDoc): SkillCard {
  const { sid, repoFull: _rf, pop: _p, cap_overflow: _co, ...rest } = d;
  return hydrateCard({ ...rest, id: sid });
}

/** CJK 查询预分词:按词切开、空格分隔后再发给 Typesense(ADR 0028)。
 *  Typesense 的 drop_tokens 只作用于「空格分隔的查询词」——连写中文「读论文」对查询解析器是一个词,
 *  无从丢词,只能全词命中(实测 found=1)。切成「读 论文」后 drop_tokens 才能丢「读」回退到「论文」(158)。
 *  纯英文/无中文查询原样返回(本就空格分词);老环境无 Intl.Segmenter 时回退原样(退回旧行为,不炸)。 */
function segmentCJK(q: string): string {
  if (!q || !/[\u3400-\u9fff]/.test(q)) return q;
  const S = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string; isWordLike: boolean }> } }).Segmenter;
  if (!S) return q;
  try {
    const parts = [...new S("zh", { granularity: "word" }).segment(q)].filter((x) => x.isWordLike).map((x) => x.segment);
    return parts.length ? parts.join(" ") : q;
  } catch {
    return q;
  }
}

/** 查询降噪(ADR 0033):剔除零信息量 token 再检索。「读论文的skill」→「读 论文」。
 *  tokens_matched 是 _text_match 的最高优先级分量——「skill」在本店是全量词(万条皆 skill,
 *  却能以 name 权重精确命中 skill-* 抢头部),「的/帮我/推荐」是功能词,谁含谁加分,全是噪声。
 *  只剔精确 token(实义动名词一律保留);全剔空时回退不剔(真搜「skill」「工具」仍可搜)。 */
const STOP_TOKENS = new Set([
  // 中文功能词
  "的", "地", "得", "了", "吗", "呢", "吧", "啊", "呀", "哦", "是", "有", "能", "会", "可以",
  "请", "帮", "帮我", "帮忙", "给我", "我", "你", "我们", "想", "要", "想要", "需要", "找", "求", "推荐",
  "这个", "那个", "这些", "那些",
  "有没有", "没有", "找个", "一下", "什么", "哪个", "哪些", "怎么", "怎样", "如何", "一个", "一款", "一些", "用", "用来", "用于",
  // 店内全量词:条条都是,不筛选任何东西
  "skill", "skills", "技能", "插件", "工具",
  // 英文功能词
  "a", "an", "the", "for", "to", "of", "with", "my", "me", "that", "this", "how", "what", "please", "find",
]);
function normalizeQuery(q: string): string {
  const seg = segmentCJK(q);
  const toks = seg.split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].toLowerCase();
    if (STOP_TOKENS.has(t)) continue;
    // 分词器把停用词切碎的情形(「插件」→「插 件」):相邻两 token 拼回仍是停用词则一并剔
    if (i + 1 < toks.length && STOP_TOKENS.has(t + toks[i + 1].toLowerCase())) { i++; continue; }
    kept.push(toks[i]);
  }
  return kept.length ? kept.join(" ") : seg;
}

export class TypesenseStore extends StaticStore implements SkillStore {
  constructor(private url: string, private key: string, base = "/idx") {
    super(base);
  }

  /**
   * P2(ADR 0018):三态全走 Typesense——默认视图 / 纯筛选 / 带词搜索,浏览器不再读 docs.json。
   *  - 带词:relevance(_text_match)主序、pop 次序;不套 per-repo cap(与旧「相关度排序」一致)。
   *  - 无词(默认/纯筛选):q=* 全量,sort cap_overflow:asc,pop:desc 复刻 applyRepoCap(头+尾,cap=3)+ 热门序。
   * B 决策:不再 fail-open 回落本地 docs——Typesense 挂即抛错,前端进「索引加载失败,刷新重试」态。
   */
  override async search(query: string, filters: SearchFilters, page: number): Promise<SearchResult> {
    const q = normalizeQuery(query.trim()); // 预分词(ADR 0028)+ 查询降噪(ADR 0033)
    const params = new URLSearchParams({
      q: q || "*", // 无词 → 通配全量
      query_by: TS_QUERY_BY,
      page: String(Math.max(1, page)),
      per_page: String(PAGE_SIZE),
      // 结果缓存:默认视图 / 翻页 / 重复词命中 Typesense 内置缓存,免重算。
      // 数据只经 typesense:push 更新(非实时),60s 陈旧无碍;不同 q/filter/sort 各自成键。
      use_cache: "true",
      cache_ttl: "60",
    });
    // 显式排序(stars/new)= 纯排序,压过相关度且不带 cap_overflow 键(2026-07-11 裁决:所见即数据);
    // missing_values: last 让缺值沉底(与本地实现一致);cap 仅保留在默认「热门」无词浏览
    const sort = filters.sort ?? "hot";
    if (q) {
      params.set("query_by_weights", TS_QUERY_WEIGHTS);
      // 模糊回退(ADR 0028):不再强制全词命中。全词命中 <10 条时逐个丢词扩召回;
      // both_sides:3 让 ≤3 词的短查询从两端各丢一次取并集。_text_match 仍主序,头部精度不塌。
      params.set("drop_tokens_threshold", "10");
      params.set("drop_tokens_mode", "both_sides:3");
      // 拼写容错解锁(ADR 0032):typo_tokens_threshold 默认 1 = 只要已有 1 条命中就永不尝试容错——
      // 「excell」被无关前缀命中 operational-excellence 卡成 found=1,excel 技能全体隐身。
      // 提到 10,与 drop_tokens_threshold 同一哲学:头部不足 10 条才扩(1-2 typo 由 num_typos 默认值管);
      // _text_match 主序保证精确命中恒压容错命中,头部精度不塌;CJK 词长 <4 不触发 typo(min_len_1typo=4),中文行为不变。
      params.set("typo_tokens_threshold", "10");
      if (sort === "stars") params.set("sort_by", "stars(missing_values: last):desc,_text_match:desc,pop:desc");
      else if (sort === "new") params.set("sort_by", "addedAt(missing_values: last):desc,_text_match:desc,pop:desc");
      else params.set("sort_by", "_text_match:desc,pop:desc");
    } else {
      if (sort === "stars") params.set("sort_by", "stars(missing_values: last):desc,pop:desc");
      else if (sort === "new") params.set("sort_by", "addedAt(missing_values: last):desc,pop:desc");
      else params.set("sort_by", "cap_overflow:asc,pop:desc"); // per-repo cap 平价 + 热门序
    }
    const fb = filterBy(filters);
    if (fb) params.set("filter_by", fb);

    // key 走 query 参数而非自定义头:请求降为「简单 GET」,消掉每次搜索前的 CORS 预检 OPTIONS
    // （往返减半,跨区尤其明显）。search-only scoped key 本就随前端包公开,query 传递不增暴露面。
    params.set("x-typesense-api-key", this.key);
    const r = await fetch(`${this.url}/collections/${TS_COLLECTION}/documents/search?${params}`);
    if (!r.ok) throw new Error(`typesense search ${r.status}: ${await r.text()}`);
    const data = (await r.json()) as { found: number; hits?: { document: TsDoc }[] };
    const items = (data.hits ?? []).map((h) => tsDocToCard(h.document));
    const total = data.found ?? items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return { items, total, page: Math.min(Math.max(1, page), pages), pages };
  }

  /** getSkill 亦走 Typesense(ADR 0018),不再读 docs.json。
   *  走 search + filter_by sid(而非文档直取端点):search-only scoped key 只授
   *  documents:search,直取需要 documents:get——生产 key 打不通。sid 含 "/",值加反引号。 */
  override async getSkill(id: string): Promise<SkillCard | null> {
    const params = new URLSearchParams({ q: "*", filter_by: `sid:=\`${id}\``, per_page: "1", use_cache: "true", cache_ttl: "60" });
    params.set("x-typesense-api-key", this.key); // 同 search:key 走 query 参数,免 CORS 预检
    const r = await fetch(`${this.url}/collections/${TS_COLLECTION}/documents/search?${params}`);
    if (!r.ok) throw new Error(`typesense get ${r.status}: ${await r.text()}`);
    const data = (await r.json()) as { hits?: { document: TsDoc }[] };
    const d = data.hits?.[0]?.document;
    return d ? tsDocToCard(d) : null;
  }
}

/** 工厂:env 配了 Typesense 就用适配器,否则纯静态——默认行为与 P0 完全一致 */
export function createStore(): SkillStore {
  const url = process.env.NEXT_PUBLIC_TYPESENSE_URL;
  const key = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
  // 自报家门(仅浏览器):验收/排障一眼分辨搜索后端;env 未注入时这里会打出 static
  if (typeof window !== "undefined") console.info(`[store] 搜索后端: ${url && key ? `typesense @ ${url}` : "static(本地)"}`);
  return url && key ? new TypesenseStore(url.replace(/\/$/, ""), key) : new StaticStore();
}

// queryTerms 仅为对齐性注记引用:Typesense 的多词 AND(drop_tokens_threshold=0)对应本地 matchScore 的全词命中
void queryTerms;
