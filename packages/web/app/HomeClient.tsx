"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StaticStore, type Pack, type SearchResult, type SkillCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";

type Chip = { slug: string; label: string; n: number };
type TagChip = Chip & { facet: string };
type FacetDef = { id: string; zh: string };
const cn = { color: "var(--faint)", marginLeft: 4, fontWeight: 600 } as const;
/** 防御式数字格式化:热更新/产物错配等异常下也绝不因 undefined 崩渲染 */
const nf = (x: number | null | undefined) => (typeof x === "number" && !Number.isNaN(x) ? x.toLocaleString() : "–");

/** 模块级单例:分片与 docs 缓存跨渲染复用 */
const store = new StaticStore();

/** 场景包跑马灯:双轨无缝循环,hover 暂停;reduced-motion 降级为静态横滑(见 globals.css) */
function PackMarquee({ packs }: { packs: Pack[] }) {
  if (!packs.length) return null;
  const Card = ({ p }: { p: Pack }) => (
    <Link href={`/pack/${p.id}/`} className="pk">
      <span className="tile" style={{ background: p.tile }}>{p.emoji}</span>
      <span>
        <span className="pt">{p.title}</span>
        <span className="pd">{p.tagline}</span>
      </span>
      <span className="arr">›</span>
    </Link>
  );
  return (
    <div className="sec">
      <div className="sec-h"><h2>一套装齐</h2><span className="k">按场景配好,一条命令</span></div>
      <div className="mq">
        <div className="mq-track">
          {packs.map((p) => <Card p={p} key={p.id} />)}
          <span aria-hidden="true" style={{ display: "contents" }}>
            {packs.map((p) => <Card p={p} key={`${p.id}-b`} />)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 首页 = 搜索 + 场景包 + 完整货架(原 /browse 整体并入,ADR 0007 的缝不变)。
 * - 默认视图走构建期分片(首屏 30 条服务端直出);筛选/搜索懒加载 docs 本地过滤;
 * - 深链 /?cat=&tag=&q=&repo=&pub= 全部支持(原 /browse 深链由薄壳跳转保活)。
 */
export default function HomeClient({ first, meta, cats, tags, facets, catTag, packs }: {
  first: SkillCard[];
  meta: { total: number; pages: number; size: number };
  cats: Chip[];
  tags: TagChip[];
  facets: FacetDef[];
  catTag: Record<string, Record<string, number>>;
  packs: Pack[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null); // 第一步:主分类(每个 skill 归一个)
  const [sel, setSel] = useState<Record<string, string | null>>({}); // 第二步:分面交叉筛(每面至多一个,AND)
  const [repo, setRepo] = useState<string | null>(null); // 深链:精确到仓(收录页「已收录 ›」)
  const [pub, setPub] = useState<string | null>(null);   // 深链:发布者
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<SearchResult>({ items: first, total: meta.total, page: 1, pages: meta.pages });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const seq = useRef(0);

  // 深链初始化(静态导出下 searchParams 只能客户端读);?tag= 支持逗号分隔多标签,各归各面
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("cat"), t = sp.get("tag"), qq = sp.get("q");
    if (c && cats.some((x) => x.slug === c)) setCat(c);
    if (t) {
      const facetOf = new Map(tags.map((x) => [x.slug, x.facet]));
      const next: Record<string, string | null> = {};
      for (const s of t.split(",")) {
        const f = facetOf.get(s);
        if (f && !next[f]) next[f] = s;
      }
      if (Object.keys(next).length) setSel(next);
    }
    if (qq) setQ(qq);
    if (sp.get("repo")) setRepo(sp.get("repo"));
    else if (sp.get("pub")) setPub(sp.get("pub"));
  }, [cats, tags]);

  const selTags = useMemo(() => Object.values(sel).filter((x): x is string => Boolean(x)), [sel]);

  // 取数:防抖 + 防竞态,全部走 store.search 一条缝
  useEffect(() => {
    const my = ++seq.current;
    const plain = !q.trim() && !cat && !selTags.length && !repo && !pub;
    if (plain && page === 1) {
      setRes({ items: first, total: meta.total, page: 1, pages: meta.pages });
      setBusy(false); setErr(false);
      return;
    }
    setBusy(true);
    const run = () =>
      store.search(q, { cat, tags: selTags, repo, publisher: pub }, page)
        .then((r) => { if (seq.current === my) { setRes(r); setErr(false); } })
        .catch(() => { if (seq.current === my) setErr(true); })
        .finally(() => { if (seq.current === my) setBusy(false); });
    const timer = setTimeout(run, q ? 160 : 0);
    return () => clearTimeout(timer);
  }, [q, cat, selTags, repo, pub, page, first, meta]);

  const goto = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const resetPage = () => setPage(1);
  const pickCat = (slug: string | null) => { setCat(slug); setSel({}); resetPage(); };
  const pickTag = (facetId: string, slug: string | null) => { setSel((s) => ({ ...s, [facetId]: slug })); resetPage(); };

  // 分面筛选组:每面一行,只显示桶内有货的标签(计数来自构建期 meta,不再全量扫描)
  const facetRows = useMemo(() => {
    if (!cat) return [];
    const inner = catTag[cat] ?? {};
    return facets
      .map((f) => ({
        f,
        items: tags.filter((t) => t.facet === f.id && inner[t.slug] > 0).map((t) => ({ ...t, n: inner[t.slug] })),
      }))
      .filter((r) => r.items.length > 0);
  }, [cat, tags, catTag, facets]);

  const selectedCat = cats.find((c) => c.slug === cat);

  return (
    <>
      <section className="hero">
        <h1>给你的 agent,<br />找对 <span className="hl">skill</span></h1>
        <div className="searchbar" style={{ marginTop: 22 }}>
          <span>🔍</span>
          <input value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder={`搜索 ${nf(meta.total)} 个 skill…`} />
        </div>
      </section>

      <PackMarquee packs={packs} />

      <div className="sec">
        <div className="sec-h"><h2>全部 skill</h2>{q.trim() && <span className="k">相关度排序</span>}</div>
      </div>

      {/* 深链来源筛选(收录页「已收录 ›」/ 发布者):显式展示,可一键清除 */}
      {(repo || pub) && (
        <div className="filters">
          <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, alignSelf: "center" }}>只看{repo ? "仓库" : "发布者"}</span>
          <button className="chip on" onClick={() => { setRepo(null); setPub(null); resetPage(); }}>
            {repo ?? `@${pub}`} ✕
          </button>
        </div>
      )}

      {/* 第一步:选分类(主轴) */}
      <div className="filters">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => pickCat(null)}>全部</button>
        {cats.map((c) => (
          <button key={c.slug} className={`chip ${cat === c.slug ? "on" : ""}`} onClick={() => pickCat(cat === c.slug ? null : c.slug)}>
            {c.label}<span style={cn}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* 第二步:选中分类后展开「分面交叉筛」——每面一行、每面至多选一个,面间 AND(像电商的品牌/尺寸/颜色) */}
      {selectedCat && facetRows.map(({ f, items }, i) => (
        <div className="filters" style={{ marginTop: i === 0 ? 8 : 4 }} key={f.id}>
          <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 700, alignSelf: "center", minWidth: 44 }}>{f.zh}</span>
          <button className={`chip ${!sel[f.id] ? "on" : ""}`} onClick={() => pickTag(f.id, null)}>不限</button>
          {items.map((t) => (
            <button key={t.slug} className={`chip ${sel[f.id] === t.slug ? "on" : ""}`} onClick={() => pickTag(f.id, sel[f.id] === t.slug ? null : t.slug)}>
              #{t.label}<span style={cn}>{t.n}</span>
            </button>
          ))}
        </div>
      ))}

      {/* 分类页不再有站内入口:IA 合并后首页筛选视图功能严格超集(同排序口径+交叉筛+全量分页),
          跳过去只会失去能力;分类页仅作 SEO 落地页与站外深链目标存在 */}
      <div className="filters">
        <span className="fcount">{nf(res.total)} / {nf(meta.total)}</span>
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
          <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, alignSelf: "center" }}>第 {res.page} / {nf(res.pages)} 页</span>
          <button className="chip" disabled={res.page >= res.pages} style={res.page >= res.pages ? { opacity: 0.4 } : undefined} onClick={() => goto(res.page + 1)}>下一页 ›</button>
        </div>
      )}
    </>
  );
}
