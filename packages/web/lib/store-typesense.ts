/**
 * P1 第一期:TypesenseStore —— SkillStore 的 Typesense 适配(ADR 0004/0007 的「换 adapter 不动接口」)。
 *
 * 路由策略(刻意保守,行为与 StaticStore 逐项对齐):
 *  - 默认视图(无词无筛选):仍走构建期分片(继承 StaticStore 快路径)——策展序 + per-repo cap 语义原样;
 *  - 带词搜索(含带筛选的搜索):走 Typesense(本期要拆的导火索就是搜索 p95);
 *  - 纯筛选(无词):仍走本地 docs 过滤(语义=applyRepoCap/计数口径不动;facet 联动留 P1 后半场)。
 *
 * 可用性:Typesense 任一错误 → fail-open 回落 StaticStore 本地搜索,商店永不因搜索服务缺席而哑。
 * 配置:NEXT_PUBLIC_TYPESENSE_URL + NEXT_PUBLIC_TYPESENSE_SEARCH_KEY(未设 = createStore 返回纯 StaticStore,
 * 行为与今天完全一致)。生产环境务必用 search-only scoped key,admin key 只进推送脚本。
 */
import {
  PAGE_SIZE, StaticStore, hydrateCard, queryTerms,
  type SearchFilters, type SearchResult, type SkillStore, type WireCard,
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
};

export const TS_COLLECTION = "skills";
/** 与 matchScore 的层级一致:name > id > scene > tags > tagline > description/publisher > skw */
export const TS_QUERY_BY = "name,sid,scene,tags,tagline,description,publisher,skw";
export const TS_QUERY_WEIGHTS = "10,6,5,4,3,2,2,1";

const hasAnyFilter = (f: SearchFilters) =>
  Boolean(f.cat || f.tag || f.tags?.length || f.evaledOnly || f.publisher || f.repo);

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

export class TypesenseStore extends StaticStore implements SkillStore {
  constructor(private url: string, private key: string, base = "/idx") {
    super(base);
  }

  override async search(query: string, filters: SearchFilters, page: number): Promise<SearchResult> {
    const q = query.trim();
    // 无词:默认视图走分片、纯筛选走本地 docs——两者语义均由父类保证
    if (!q) return super.search(query, filters, page);
    try {
      const params = new URLSearchParams({
        q,
        query_by: TS_QUERY_BY,
        query_by_weights: TS_QUERY_WEIGHTS,
        sort_by: "_text_match:desc,pop:desc",
        page: String(Math.max(1, page)),
        per_page: String(PAGE_SIZE),
        // AND 语义对齐 matchScore(所有词都须命中);禁用 drop_tokens 的“逐词放宽”
        drop_tokens_threshold: "0",
      });
      const fb = filterBy(filters);
      if (fb) params.set("filter_by", fb);
      const r = await fetch(`${this.url}/collections/${TS_COLLECTION}/documents/search?${params}`, {
        headers: { "x-typesense-api-key": this.key },
      });
      if (!r.ok) throw new Error(`typesense ${r.status}`);
      const data = (await r.json()) as {
        found: number;
        hits?: { document: TsDoc }[];
      };
      const items = (data.hits ?? []).map((h) => {
        const { sid, repoFull: _rf, pop: _p, ...rest } = h.document;
        return hydrateCard({ ...rest, id: sid });
      });
      const total = data.found ?? items.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      return { items, total, page: Math.min(Math.max(1, page), pages), pages };
    } catch {
      // fail-open:搜索服务缺席/超时 → 本地 docs 兜底(行为=P0),绝不白屏
      return super.search(query, filters, page);
    }
  }
}

/** 工厂:env 配了 Typesense 就用适配器,否则纯静态——默认行为与 P0 完全一致 */
export function createStore(): SkillStore {
  const url = process.env.NEXT_PUBLIC_TYPESENSE_URL;
  const key = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;
  return url && key ? new TypesenseStore(url.replace(/\/$/, ""), key) : new StaticStore();
}

// queryTerms 仅为对齐性注记引用:Typesense 的多词 AND(drop_tokens_threshold=0)对应本地 matchScore 的全词命中
void queryTerms;
