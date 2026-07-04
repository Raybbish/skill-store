"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StaticStore, type SearchResult, type SkillCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";

type Chip = { slug: string; label: string; n: number };
const cn = { color: "var(--faint)", marginLeft: 4, fontWeight: 600 } as const;

/** 模块级单例:分片与 docs 缓存跨渲染复用 */
const store = new StaticStore();

/**
 * P0(ADR 0007):任何时刻 DOM 只有 ≤30 行,免虚拟化。
 * - 默认视图:走构建期分片(首屏来自服务端 props,翻页 fetch /idx/pages/pN.json);
 * - 筛选/搜索:懒加载一次 /idx/docs.json 后本地过滤 —— 全部经 store.search() 一条缝,
 *   P1 换 Typesense 时只换 store 实现。
 * 支持深链:/browse/?cat=…&tag=…&q=…(分类页「看全部」跳转用)。
 */
export default function BrowseClient({ first, meta, cats, tags, catTag }: {
  first: SkillCard[];
  meta: { total: number; pages: number; size: number };
  cats: Chip[];
  tags: Chip[];
  catTag: Record<string, Record<string, number>>;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null); // 第一步:主分类(每个 skill 归一个)
  const [tag, setTag] = useState<string | null>(null); // 第二步:分类内细分标签(横切,选填)
  const [safeOnly, setSafeOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<SearchResult>({ items: first, total: meta.total, page: 1, pages: meta.pages });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const seq = useRef(0);

  // 深链初始化(静态导出下 searchParams 只能客户端读)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("cat"), t = sp.get("tag"), qq = sp.get("q");
    if (c && cats.some((x) => x.slug === c)) setCat(c);
    if (t) setTag(t);
    if (qq) setQ(qq);
  }, [cats]);

  // 取数:防抖 + 防竞态,全部走 store.search 一条缝
  useEffect(() => {
    const my = ++seq.current;
    const plain = !q.trim() && !cat && !tag && !safeOnly;
    if (plain && page === 1) {
      setRes({ items: first, total: meta.total, page: 1, pages: meta.pages });
      setBusy(false); setErr(false);
      return;
    }
    setBusy(true);
    const run = () =>
      store.search(q, { cat, tag, safeOnly }, page)
        .then((r) => { if (seq.current === my) { setRes(r); setErr(false); } })
        .catch(() => { if (seq.current === my) setErr(true); })
        .finally(() => { if (seq.current === my) setBusy(false); });
    const timer = setTimeout(run, q ? 160 : 0);
    return () => clearTimeout(timer);
  }, [q, cat, tag, safeOnly, page, first, meta]);

  const goto = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const resetPage = () => setPage(1);
  const pickCat = (slug: string | null) => { setCat(slug); setTag(null); resetPage(); };
  const pickTag = (slug: string | null) => { setTag(slug); resetPage(); };

  // 桶内细分:计数来自构建期 meta(不再全量扫描)
  const subTags = useMemo<Chip[]>(() => {
    if (!cat) return [];
    const inner = catTag[cat] ?? {};
    return tags.filter((t) => inner[t.slug] > 0).map((t) => ({ ...t, n: inner[t.slug] }));
  }, [cat, tags, catTag]);

  const selectedCat = cats.find((c) => c.slug === cat);

  return (
    <>
      <section className="hero"><div className="eyebrow">浏览</div><h1 className="small">全部 skill</h1></section>

      <div className="searchbar" style={{ marginTop: 4 }}>
        <span>🔍</span>
        <input value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder={`搜索 ${meta.total.toLocaleString()} 个 skill…`} />
      </div>

      {/* 第一步:选分类(主轴) */}
      <div className="filters">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => pickCat(null)}>全部</button>
        {cats.map((c) => (
          <button key={c.slug} className={`chip ${cat === c.slug ? "on" : ""}`} onClick={() => pickCat(cat === c.slug ? null : c.slug)}>
            {c.label}<span style={cn}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* 第二步:选中分类后才出现「桶内细分」(次轴) */}
      {selectedCat && subTags.length > 0 && (
        <div className="filters" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 700, alignSelf: "center" }}>在「{selectedCat.label}」内细分</span>
          <button className={`chip ${!tag ? "on" : ""}`} onClick={() => pickTag(null)}>不限</button>
          {subTags.map((t) => (
            <button key={t.slug} className={`chip ${tag === t.slug ? "on" : ""}`} onClick={() => pickTag(tag === t.slug ? null : t.slug)}>
              #{t.label}<span style={cn}>{t.n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="filters">
        <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>{q.trim() ? "相关度排序" : "热门排序"}</span>
        <button className={`chip ${safeOnly ? "on" : ""}`} onClick={() => { setSafeOnly(!safeOnly); resetPage(); }}>🛡️ 仅无网络请求</button>
        {selectedCat && <Link href={`/category/${selectedCat.slug}/`} className="chip">看「{selectedCat.label}」分类页 ↗</Link>}
        <span className="fcount">{res.total.toLocaleString()} / {meta.total.toLocaleString()}</span>
      </div>

      <div className="list" style={busy ? { opacity: 0.55, transition: "opacity .15s" } : undefined}>
        {res.items.map((s) => <SkillRow key={s.id} skill={s} />)}
        {!res.items.length && !busy && <div className="empty">{err ? "索引加载失败,刷新重试" : "无匹配结果"}</div>}
        {!res.items.length && busy && <div className="empty">加载中…</div>}
      </div>

      {/* 分页:DOM 恒小的关键 —— 永远只渲染当前页 */}
      {res.pages > 1 && (
        <div className="filters" style={{ marginTop: 16, justifyContent: "center" }}>
          <button className="chip" disabled={res.page <= 1} style={res.page <= 1 ? { opacity: 0.4 } : undefined} onClick={() => goto(res.page - 1)}>‹ 上一页</button>
          <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, alignSelf: "center" }}>第 {res.page} / {res.pages.toLocaleString()} 页</span>
          <button className="chip" disabled={res.page >= res.pages} style={res.page >= res.pages ? { opacity: 0.4 } : undefined} onClick={() => goto(res.page + 1)}>下一页 ›</button>
        </div>
      )}
    </>
  );
}
