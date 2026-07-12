/**
 * SkillStore —— 前端取数的唯一缝(ADR 0007)。
 *
 * 北极星:前端只通过 `search(query, filters, page)` 与 `getSkill(id)` 取数;
 * 背后实现逐阶替换(P0 静态分片+客户端过滤 → P1 Typesense → P2 Postgres),
 * 本文件的接口签名不随实现变化。
 *
 * 本文件**客户端安全**(不 import fs);服务端构建期读取见 store-server.ts。
 */
import type { Skill } from "./skill-types";
import { applyRepoCap } from "./skill-utils";

/** 每页条数:DOM 恒 ≤ ~30 行,免虚拟化 */
export const PAGE_SIZE = 30;

/** 信任披露字段(ADR 0012 步骤④):TRUST_DISPLAY=1 且 policy 定稿时由 build-index 注入;
 *  缺省 = 不展示(TrustBadge 恒 null)。商店只透传不解释——门禁谓词在 @skill-store/verdicts。 */
export interface CardVerdict {
  status: string;
  policy: string;
  factors?: Record<string, { present: boolean | null; detail?: string }>;
}

/** 列表行所需的最小字段面(瘦卡片)。
 *  刻意不含 eval.tasks / license 等重字段——那些只在详情页(全量 Skill)出现。
 *  字段与 Skill 同名同型,因此全量 Skill 结构上就是一张合法的 SkillCard,组件两边通吃。 */
export interface SkillCard {
  id: string; owner: string; repo: string; name: string;
  description?: string; publisher: string;
  category?: string; tags?: string[];
  /** 微文案标题(回退 description);搜索字段之一 */
  tagline?: string;
  /** 英文转述(ADR 0022):en locale 卡片副标题;缺失回退 description 原文 */
  taglineEn?: string;
  /** 英文场景词(launch 期不做词表治理,全量随卡) */
  sceneEn?: string[];
  /** 可点场景 chip(build-index 裁到词频≥SCENE_VISIBLE_MIN 的可见词);点击=以该词搜索 */
  scene?: string[];
  /** 不达标场景词(词频<阈值)拼成的搜索召回串,UI 不显示;多为空,省字节时省略 */
  skw?: string;
  /** 上游链接:列表线格式(WireCard)不携带——只有详情页用,走全量 Skill(必有) */
  upstream?: string;
  stars?: number | null; installs?: number | null; repoSkillCount?: number;
  bulkSource?: boolean;
  /** 信任披露(见 CardVerdict;S0 恒缺省) */
  verdict?: CardVerdict;
  /** 评测总分(未评测为 null/缺省);全量 Skill 上对应 eval.score */
  ev?: number | null;
  /** 收录时间(Unix 秒,来自 catalog git 首次提交;build-index 注入,Skill 上没有) */
  addedAt?: number;
  /** 本店有安装包可下(.skill/.zip):构建期磁盘事实(hasMirror),包页/列表的下载入口凭据 */
  dl?: boolean;
}

/** 场景包:一套一起装的 skill(catalog/packs 策展) */
export interface Pack {
  id: string;
  emoji: string;
  /** 图标底色(跑马灯瓷片) */
  tile: string;
  title: string;
  tagline: string;
  /** 包货架文案英文版(ADR 0022;catalog/packs 的 title_en/tagline_en;手记为署名内容不翻) */
  titleEn?: string;
  taglineEn?: string;
  members: SkillCard[];
  /** 编辑手记(活人感 P0):人写人签,机器只出草稿;缺省不渲染 */
  editorNote?: { text: string; author: string; date: string; text_en?: string };
}

/** 列表排序键:hot=货架热门序(默认,带词时=相关度);stars=仓 star 数;new=收录时间 */
export type SortKey = "hot" | "stars" | "new";

export interface SearchFilters {
  cat?: string | null;
  tag?: string | null;
  /** 分面交叉筛:全部命中才通过(AND);与 tag 并存,tag 保留给旧深链/分类页 */
  tags?: string[] | null;
  /** 仅已评测(ev != null) */
  evaledOnly?: boolean;
  publisher?: string | null;
  /** 精确到仓:"owner/repo"(合集页「已收录 ›」深链用) */
  repo?: string | null;
  /** 排序(非筛选,不参与 matchFilters/计数);缺省 = hot */
  sort?: SortKey | null;
}

export interface SearchResult {
  items: SkillCard[];
  total: number;
  page: number;
  pages: number;
}

export interface SkillStore {
  search(query: string, filters: SearchFilters, page: number): Promise<SearchResult>;
  getSkill(id: string): Promise<SkillCard | null>;
}

/** 索引元数据(build-index 产出的 public/idx/meta.json) */
export interface IdxMeta {
  generatedAt: string;
  total: number;
  pages: number;
  size: number;
  /** 分类 slug → 命中数(主分类或标签命中,与货架口径一致) */
  cats: Record<string, number>;
  /** 标签 slug → 命中数 */
  tags: Record<string, number>;
  /** 分类 slug → (标签 slug → 该分类内命中数),桶内细分用 */
  catTag: Record<string, Record<string, number>>;
  /** 可见场景词表(词频 ≥ SCENE_VISIBLE_MIN;卡片 chip 与「场景」入口取自这里)。缺省=尚无微文案 */
  sceneVocab?: string[];
}

/** 商店周报(/changelog):手写条目来自 catalog/changelog.json;weekAdded 由 build-index 从 addedAt 统计 */
export interface ChangelogEntry {
  /** ISO 日期 YYYY-MM-DD */
  date: string;
  /** release=上线 / change=变更 / notice=公告;缺省不标签 */
  kind?: "release" | "change" | "notice";
  text: string;
  /** 英文版(ADR 0022:商店的话跟语言走);缺省回退 text 原文 */
  text_en?: string;
}
export interface Changelog {
  generatedAt: string;
  /** 本周(自最近周一 00:00)新增上架数 */
  weekAdded: number;
  entries: ChangelogEntry[];
}

/** Skill → SkillCard(构建索引与服务端列表页共用;undefined 字段不落 JSON) */
export function toCard(s: Skill): SkillCard {
  return {
    id: s.id, owner: s.owner, repo: s.repo, name: s.name,
    ...(s.description ? { description: s.description } : {}),
    publisher: s.publisher,
    ...(s.category ? { category: s.category } : {}),
    ...(s.tags?.length ? { tags: s.tags } : {}),
    ...(s.tagline ? { tagline: s.tagline } : {}),
    ...(s.taglineEn ? { taglineEn: s.taglineEn } : {}),
    ...(s.sceneTagsEn?.length ? { sceneEn: s.sceneTagsEn } : {}),
    // scene 此处装全量归一场景词;build-index 按全局词频裁成可见 chip(scene)+ 召回串(skw)
    ...(s.sceneTags?.length ? { scene: s.sceneTags } : {}),
    upstream: s.upstream,
    ...(s.stars != null ? { stars: s.stars } : {}),
    ...(s.installs != null ? { installs: s.installs } : {}),
    ...(s.repoSkillCount != null ? { repoSkillCount: s.repoSkillCount } : {}),
    ...(s.bulkSource ? { bulkSource: true } : {}),
    ...(s.eval ? { ev: s.eval.score } : {}),
    ...(s.hasMirror ? { dl: true } : {}),
  };
}

/** 线格式(idx 落盘/传输的瘦卡):SkillCard 去掉可派生与列表不用的字段——
 *  owner/repo 由三段式 id 派生;publisher 与 id 首段相同时省略(≈100% 命中);
 *  upstream 不进列表(详情页走全量 Skill);description 裁到 WIRE_DESC_MAX
 *  (卡片只显 60 字,搜索对超长描述的召回边际趋零;详情页不受影响)。
 *  载荷工程(2026-07-07):docs.json 7.7MB → 大幅回落,P1 门槛口径不变、数值自然回落;
 *  P1 换 Typesense 时线格式随 adapter 一起退役。 */
export type WireCard = Omit<SkillCard, "owner" | "repo" | "publisher"> & { publisher?: string };
export const WIRE_DESC_MAX = 160;

/** SkillCard → 线格式(build-index 落盘用) */
export function toWire(c: SkillCard): WireCard {
  const { owner: _o, repo: _r, publisher, upstream: _u, ...rest } = c;
  const w: WireCard = rest;
  if (publisher && publisher !== c.id.split("/")[0]) w.publisher = publisher;
  if (w.description && w.description.length > WIRE_DESC_MAX) w.description = w.description.slice(0, WIRE_DESC_MAX);
  return w;
}

/** 线格式 → SkillCard(StaticStore 与 store-server 读取时水合;组件永远只见完整瘦卡) */
export function hydrateCard(w: WireCard): SkillCard {
  const [owner = "", repo = ""] = w.id.split("/");
  return { owner, repo, publisher: w.publisher ?? owner, ...w };
}

/** 过滤谓词(客户端与构建期计数共用同一口径) */
export function matchFilters(c: SkillCard, f: SearchFilters): boolean {
  if (f.cat && c.category !== f.cat) return false;
  if (f.tag && !(c.tags ?? []).includes(f.tag)) return false;
  if (f.tags?.length && !f.tags.every((t) => (c.tags ?? []).includes(t))) return false;
  if (f.evaledOnly && c.ev == null) return false;
  if (f.publisher && c.publisher !== f.publisher) return false;
  if (f.repo && `${c.owner}/${c.repo}` !== f.repo) return false;
  return true;
}

/** 相关度打分:所有词都须命中(AND);name 前缀 > name 含 > id 含 > 标签 > 描述/发布者。
 *  中文按子串命中,行为向后兼容旧版「id+描述子串」搜索,只是排序更合理。 */
export function matchScore(c: SkillCard, terms: string[]): number {
  let total = 0;
  const name = c.name.toLowerCase();
  const id = c.id.toLowerCase();
  const tagline = `${c.tagline ?? ""} ${c.taglineEn ?? ""}`.toLowerCase(); // 中英同权重召回(ADR 0022)
  const scene = [...(c.scene ?? []), ...(c.sceneEn ?? [])].map((x) => x.toLowerCase());
  const skw = (c.skw ?? "").toLowerCase(); // 不可见场景词的召回串
  const desc = (c.description ?? "").toLowerCase();
  const pub = c.publisher.toLowerCase();
  for (const t of terms) {
    let s = 0;
    if (name.startsWith(t)) s = 100;
    else if (name.includes(t)) s = 60;
    else if (id.includes(t)) s = 40;
    else if (scene.some((x) => x.includes(t))) s = 30; // 场景词命中:比技术标签更贴用户意图
    else if ((c.tags ?? []).some((x) => x.toLowerCase().includes(t))) s = 25;
    else if (tagline.includes(t)) s = 18;
    else if (desc.includes(t) || pub.includes(t)) s = 12;
    else if (skw.includes(t)) s = 8; // 不达标场景词只做兜底召回
    if (!s) return 0;
    total += s;
  }
  return total;
}

export function queryTerms(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

const hasFilters = (f: SearchFilters) =>
  Boolean(f.cat || f.tag || f.tags?.length || f.evaledOnly || f.publisher || f.repo);

/**
 * P0 实现:静态分片 + 客户端过滤。
 * - 默认视图(无词无筛选):直接取构建期分片 /idx/pages/p{n}.json,首屏零索引下载;
 * - 任何筛选/搜索:懒加载一次 /idx/docs.json(全量瘦卡,gzip 后 <1MB @6k),本地过滤分页;
 * - docs.json 为纯热门序;非搜索场景过滤后补 applyRepoCap,与分片口径一致。
 * P1 换 TypesenseStore 时:实现同一 SkillStore 接口,组件零改动。
 */
export class StaticStore implements SkillStore {
  private meta: IdxMeta | null = null;
  private pageCache = new Map<number, SkillCard[]>();
  private docs: SkillCard[] | null = null;
  private docsPromise: Promise<SkillCard[]> | null = null;
  /** 构建版本号(meta.generatedAt),缓存击穿用:重建 index 后 URL 变、浏览器不会喂旧 docs/分片 */
  private ver = "";

  constructor(private base = "/idx") {}

  private async fetchJson<T>(path: string, noStore = false): Promise<T> {
    const r = await fetch(`${this.base}${path}`, noStore ? { cache: "no-store" } : undefined);
    if (!r.ok) throw new Error(`idx fetch ${path}: ${r.status}`);
    return r.json() as Promise<T>;
  }

  async getMeta(): Promise<IdxMeta> {
    // meta 小(~4KB),永远 no-store 拿最新;它带的 generatedAt 给 docs/分片做缓存击穿键
    if (!this.meta) {
      this.meta = await this.fetchJson<IdxMeta>("/meta.json", true);
      this.ver = encodeURIComponent(this.meta.generatedAt ?? "");
    }
    return this.meta;
  }

  private loadDocs(): Promise<SkillCard[]> {
    if (this.docs) return Promise.resolve(this.docs);
    if (!this.docsPromise) {
      // 先确保 meta(拿到 ver),再按版本取 docs——重建后 ?v= 变,旧缓存自动失效
      this.docsPromise = this.getMeta()
        .then(() => this.fetchJson<WireCard[]>(`/docs.json?v=${this.ver}`))
        .then((d) => (this.docs = d.map(hydrateCard)));
    }
    return this.docsPromise;
  }

  async search(query: string, filters: SearchFilters, page: number): Promise<SearchResult> {
    const q = query.trim();
    const sort = filters.sort ?? "hot";
    // 快路径:默认视图(热门序)走构建期分片
    if (!q && !hasFilters(filters) && sort === "hot") {
      const meta = await this.getMeta();
      const p = Math.min(Math.max(1, page), Math.max(1, meta.pages));
      let items = this.pageCache.get(p);
      if (!items) {
        // meta 已在上方 await(this.ver 就绪);分片按版本取,重建后不吃旧缓存;线格式水合成完整瘦卡
        items = (await this.fetchJson<WireCard[]>(`/pages/p${p}.json?v=${this.ver}`)).map(hydrateCard);
        this.pageCache.set(p, items);
      }
      return { items, total: meta.total, page: p, pages: meta.pages };
    }
    // 慢路径:懒加载全量瘦卡,本地过滤
    const docs = await this.loadDocs();
    let list = docs.filter((c) => matchFilters(c, filters));
    if (q) {
      const terms = queryTerms(q);
      list = list
        .map((c, i) => ({ c, s: matchScore(c, terms), i }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || a.i - b.i) // 同分保持热门序(稳定)
        .map((x) => x.c);
    }
    // 显式排序(stars/new)= 纯排序,不套 per-repo cap(2026-07-11 裁决:所见即数据,
    // 聚合仓同分连排是事实就照排);cap 仅保留在默认「热门」序(货架反刷屏机制,ADR 0005)
    if (sort === "stars") list = [...list].sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
    else if (sort === "new") list = [...list].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
    else if (!q) list = applyRepoCap(list);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const p = Math.min(Math.max(1, page), pages);
    return { items: list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE), total: list.length, page: p, pages };
  }

  async getSkill(id: string): Promise<SkillCard | null> {
    const docs = await this.loadDocs();
    return docs.find((c) => c.id === id) ?? null;
  }
}
