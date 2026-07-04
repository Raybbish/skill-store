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

/** 列表行所需的最小字段面(瘦卡片)。
 *  刻意不含 eval.tasks / license 等重字段——那些只在详情页(全量 Skill)出现。
 *  字段与 Skill 同名同型,因此全量 Skill 结构上就是一张合法的 SkillCard,组件两边通吃。 */
export interface SkillCard {
  id: string; owner: string; repo: string; name: string;
  description?: string; publisher: string;
  category?: string; tags?: string[];
  upstream: string;
  stars?: number | null; installs?: number | null; repoSkillCount?: number;
  bulkSource?: boolean;
  /** 评测总分(未评测为 null/缺省);全量 Skill 上对应 eval.score */
  ev?: number | null;
  /** 收录时间(Unix 秒,来自 catalog git 首次提交;build-index 注入,Skill 上没有) */
  addedAt?: number;
}

/** 场景包:一套一起装的 skill(catalog/packs 策展) */
export interface Pack {
  id: string;
  emoji: string;
  /** 图标底色(跑马灯瓷片) */
  tile: string;
  title: string;
  tagline: string;
  members: SkillCard[];
}

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
}

/** Skill → SkillCard(构建索引与服务端列表页共用;undefined 字段不落 JSON) */
export function toCard(s: Skill): SkillCard {
  return {
    id: s.id, owner: s.owner, repo: s.repo, name: s.name,
    ...(s.description ? { description: s.description } : {}),
    publisher: s.publisher,
    ...(s.category ? { category: s.category } : {}),
    ...(s.tags?.length ? { tags: s.tags } : {}),
    upstream: s.upstream,
    ...(s.stars != null ? { stars: s.stars } : {}),
    ...(s.installs != null ? { installs: s.installs } : {}),
    ...(s.repoSkillCount != null ? { repoSkillCount: s.repoSkillCount } : {}),
    ...(s.bulkSource ? { bulkSource: true } : {}),
    ...(s.eval ? { ev: s.eval.score } : {}),
  };
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
  const desc = (c.description ?? "").toLowerCase();
  const pub = c.publisher.toLowerCase();
  for (const t of terms) {
    let s = 0;
    if (name.startsWith(t)) s = 100;
    else if (name.includes(t)) s = 60;
    else if (id.includes(t)) s = 40;
    else if ((c.tags ?? []).some((x) => x.toLowerCase().includes(t))) s = 25;
    else if (desc.includes(t) || pub.includes(t)) s = 12;
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

  constructor(private base = "/idx") {}

  private async fetchJson<T>(path: string): Promise<T> {
    const r = await fetch(`${this.base}${path}`);
    if (!r.ok) throw new Error(`idx fetch ${path}: ${r.status}`);
    return r.json() as Promise<T>;
  }

  async getMeta(): Promise<IdxMeta> {
    if (!this.meta) this.meta = await this.fetchJson<IdxMeta>("/meta.json");
    return this.meta;
  }

  private loadDocs(): Promise<SkillCard[]> {
    if (this.docs) return Promise.resolve(this.docs);
    if (!this.docsPromise) {
      this.docsPromise = this.fetchJson<SkillCard[]>("/docs.json").then((d) => (this.docs = d));
    }
    return this.docsPromise;
  }

  async search(query: string, filters: SearchFilters, page: number): Promise<SearchResult> {
    const q = query.trim();
    // 快路径:默认视图走构建期分片
    if (!q && !hasFilters(filters)) {
      const meta = await this.getMeta();
      const p = Math.min(Math.max(1, page), Math.max(1, meta.pages));
      let items = this.pageCache.get(p);
      if (!items) {
        items = await this.fetchJson<SkillCard[]>(`/pages/p${p}.json`);
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
    } else {
      list = applyRepoCap(list);
    }
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const p = Math.min(Math.max(1, page), pages);
    return { items: list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE), total: list.length, page: p, pages };
  }

  async getSkill(id: string): Promise<SkillCard | null> {
    const docs = await this.loadDocs();
    return docs.find((c) => c.id === id) ?? null;
  }
}
