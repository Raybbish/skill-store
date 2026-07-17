"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type Pack, type SearchResult, type SkillCard, type SortKey } from "@/lib/store";
import { createStore } from "@/lib/store-typesense";
import SkillRow from "@/components/SkillRow";
import { trackSearch } from "@/lib/analytics";
import { localePath, t, type Locale, type MsgKey } from "@/lib/i18n";

type Chip = { slug: string; label: string; n: number };
type TagChip = Chip & { facet: string };
type FacetChip = { id: string; label: string };
const cn = { color: "var(--faint)", marginLeft: 4, fontWeight: 600 } as const;
/** 防御式数字格式化:热更新/产物错配等异常下也绝不因 undefined 崩渲染 */
const nf = (x: number | null | undefined) => (typeof x === "number" && !Number.isNaN(x) ? x.toLocaleString() : "–");

/** 模块级单例:分片与 docs 缓存跨渲染复用。
 *  工厂按 env 决定后端:配了 NEXT_PUBLIC_TYPESENSE_* → 带词搜索走 Typesense(失败回落本地);
 *  未配 → 纯 StaticStore,行为与 P0 完全一致。 */
const store = createStore();

/** 场景包横滑:手动滚动(触控板/滚轮/箭头按钮),不自动播放(见 globals.css) */
function PackShelf({ packs, locale }: { packs: Pack[]; locale: Locale }) {
  const rail = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    el?.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: "smooth" });
  };
  if (!packs.length) return null;
  const Card = ({ p }: { p: Pack }) => (
    <Link href={localePath(locale, `/pack/${p.id}/`)} className="pk">
      <span className="tile" style={{ background: p.tile }}>{p.emoji}</span>
      <span>
        <span className="pt">{locale === "en" ? p.titleEn ?? p.title : p.title}</span>
        <span className="pd">{locale === "en" ? p.taglineEn ?? p.tagline : p.tagline}</span>
      </span>
      <span className="arr">›</span>
    </Link>
  );
  return (
    <div className="sec">
      <div className="sec-h">
        <h2>{t(locale, "home.packsTitle")}</h2><span className="k">{t(locale, "home.packsK")}</span>
        <span className="mq-nav">
          <button type="button" aria-label={t(locale, "home.packsPrev")} onClick={() => nudge(-1)}>‹</button>
          <button type="button" aria-label={t(locale, "home.packsNext")} onClick={() => nudge(1)}>›</button>
        </span>
      </div>
      <div className="mq" ref={rail}>
        <div className="mq-track">
          {packs.map((p) => <Card p={p} key={p.id} />)}
        </div>
      </div>
    </div>
  );
}

/** 页码窗口:首尾 + 当前邻域,中间空档收成省略号。331 页也只渲染 ~7 个页码。 */
function pageWindow(cur: number, total: number): (number | "…")[] {
  const uniq = [...new Set([1, cur - 1, cur, cur + 1, total].filter((n) => n >= 1 && n <= total))].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of uniq) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

/** 分页条:页码窗口(可点跳转)+ 跳页输入框。DOM 恒小 —— 永远只渲染当前页数据,页码是纯导航。 */
function Pager({ page, pages, goto, locale }: { page: number; pages: number; goto: (p: number) => void; locale: Locale }) {
  const [jump, setJump] = useState("");
  const tt = (k: MsgKey, vars?: Record<string, string | number>) => t(locale, k, vars);
  const submitJump = () => {
    const n = parseInt(jump, 10);
    if (Number.isFinite(n)) goto(Math.min(Math.max(1, n), pages));
    setJump("");
  };
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label={tt("home.pagerLabel")}>
      <button className="chip" disabled={page <= 1} onClick={() => goto(page - 1)} aria-label={tt("home.prev")}>‹</button>
      {pageWindow(page, pages).map((p, i) =>
        p === "…"
          ? <span key={`gap${i}`} className="pager-gap" aria-hidden="true">…</span>
          : <button key={p} className={`chip pager-n ${p === page ? "on" : ""}`} aria-current={p === page ? "page" : undefined} onClick={() => goto(p)}>{p}</button>,
      )}
      <button className="chip" disabled={page >= pages} onClick={() => goto(page + 1)} aria-label={tt("home.next")}>›</button>
      <span className="pager-jump">
        <label htmlFor="pgj">{tt("home.jumpTo")}</label>
        <input
          id="pgj" type="text" inputMode="numeric" pattern="[0-9]*" value={jump}
          onChange={(e) => setJump(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => { if (e.key === "Enter") submitJump(); }}
          placeholder={String(page)} aria-label={tt("home.jumpAria", { n: pages })}
        />
        {tt("home.pageUnit") && <span>{tt("home.pageUnit")}</span>}
        <button className="chip pager-go" disabled={!jump} onClick={submitJump}>{tt("home.jumpGo")}</button>
      </span>
    </nav>
  );
}

/**
 * 首页 = 搜索 + 场景包 + 完整货架(原 /browse 整体并入,ADR 0007 的缝不变)。
 * - 默认视图走构建期分片(首屏 30 条服务端直出);筛选/搜索懒加载 docs 本地过滤;
 * - 深链 /?cat=&tag=&q=&repo=&pub= 全部支持(原 /browse 深链由薄壳跳转保活)。
 * - locale 由服务端路由注入(/ = zh,/en/ = en),词随 locale,数据同一份(ADR 0022)。
 */
export default function HomeClient({ locale, first, meta, cats, tags, facets, catTag, packs }: {
  locale: Locale;
  first: SkillCard[];
  meta: { total: number; pages: number; size: number; sceneVocab?: string[] };
  cats: Chip[];
  tags: TagChip[];
  facets: FacetChip[];
  catTag: Record<string, Record<string, number>>;
  packs: Pack[];
}) {
  const tt = (k: MsgKey, vars?: Record<string, string | number>) => t(locale, k, vars);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null); // 第一步:主分类(每个 skill 归一个)
  const [sel, setSel] = useState<Record<string, string | null>>({}); // 第二步:分面交叉筛(每面至多一个,AND)
  const [repo, setRepo] = useState<string | null>(null); // 深链:精确到仓(收录页「已收录 ›」)
  const [pub, setPub] = useState<string | null>(null);   // 深链:发布者
  const [sort, setSort] = useState<SortKey>("hot");      // 排序:热门(默认)/ Star 数 / 最新收录
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<SearchResult>({ items: first, total: meta.total, page: 1, pages: meta.pages });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const seq = useRef(0);

  // 深链初始化(静态导出下 searchParams 只能客户端读);?tag= 支持逗号分隔多标签,各归各面
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("cat"), tg = sp.get("tag"), qq = sp.get("q");
    if (c && cats.some((x) => x.slug === c)) setCat(c);
    if (tg) {
      const facetOf = new Map(tags.map((x) => [x.slug, x.facet]));
      const next: Record<string, string | null> = {};
      for (const s of tg.split(",")) {
        const f = facetOf.get(s);
        if (f && !next[f]) next[f] = s;
      }
      if (Object.keys(next).length) setSel(next);
    }
    if (qq) setQ(qq);
    if (sp.get("repo")) setRepo(sp.get("repo"));
    else if (sp.get("pub")) setPub(sp.get("pub"));
    const so = sp.get("sort");
    if (so === "stars" || so === "new") setSort(so);
  }, [cats, tags]);

  const selTags = useMemo(() => Object.values(sel).filter((x): x is string => Boolean(x)), [sel]);

  // 取数:防抖 + 防竞态,全部走 store.search 一条缝
  useEffect(() => {
    const my = ++seq.current;
    const plain = !q.trim() && !cat && !selTags.length && !repo && !pub && sort === "hot";
    if (plain && page === 1) {
      setRes({ items: first, total: meta.total, page: 1, pages: meta.pages });
      setBusy(false); setErr(false);
      return;
    }
    setBusy(true);
    const run = () => {
      if (q.trim() && page === 1) trackSearch(q); // 埋点:一次执行的搜索(防抖后),翻页不重复计
      return store.search(q, { cat, tags: selTags, repo, publisher: pub, sort }, page)
        .then((r) => { if (seq.current === my) { setRes(r); setErr(false); } })
        .catch(() => { if (seq.current === my) setErr(true); })
        .finally(() => { if (seq.current === my) setBusy(false); });
    };
    const timer = setTimeout(run, q ? 350 : 0); // 防抖窗口:带词 350ms(收住逐字输入中间态 + 减少高延迟下的请求叠加),清空/纯筛选即时响应
    return () => clearTimeout(timer);
  }, [q, cat, selTags, repo, pub, sort, page, first, meta]);

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
        items: tags.filter((x) => x.facet === f.id && inner[x.slug] > 0).map((x) => ({ ...x, n: inner[x.slug] })),
      }))
      .filter((r) => r.items.length > 0);
  }, [cat, tags, catTag, facets]);

  const selectedCat = cats.find((c) => c.slug === cat);

  // 搜索词命中可见场景词 → 「话题聚合页」抬头(实现上仍是搜索,只换壳;ADR 0013 补充)
  const sceneHit = (() => {
    const w = q.trim().toLowerCase();
    return w ? (meta.sceneVocab ?? []).find((v) => v.toLowerCase() === w) : undefined;
  })();

  return (
    <>
      <section className="hero">
        {locale === "en"
          ? <h1>Find the right <span className="hl">skills</span><br />for your agent</h1>
          : <h1>给你的 agent,<br />找对 <span className="hl">skill</span></h1>}
        <div className="searchbar" style={{ marginTop: 22 }}>
          {/* 单色描边镜(替代彩色 emoji 🔍:平台渲染一致,可继承颜色) */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
          <input type="search" aria-label={tt("home.searchLabel")} value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} placeholder={tt("home.searchPlaceholder", { n: nf(meta.total) })} />
        </div>
      </section>

      <PackShelf packs={packs} locale={locale} />

      <div className="sec">
        <div className="sec-h">
          {sceneHit
            ? (
              <h2>
                <span className="sc-mark">{tt("home.scene")}</span>{sceneHit}
                <button
                  className="sc-x"
                  aria-label={tt("home.exitScene")}
                  onClick={() => {
                    setQ(""); resetPage();
                    const sp = new URLSearchParams(window.location.search);
                    sp.delete("q");
                    window.history.replaceState(null, "", window.location.pathname + (sp.size ? `?${sp}` : ""));
                  }}
                >✕</button>
              </h2>
            )
            : <h2>{tt("home.allSkills")}</h2>}
          {q.trim() && sort === "hot" && <span className="k">{tt("home.relevance")}</span>}
        </div>
      </div>

      {/* 深链来源筛选(收录页「已收录 ›」/ 发布者):显式展示,可一键清除 */}
      {(repo || pub) && (
        <div className="filters">
          <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600, alignSelf: "center" }}>{repo ? tt("home.filterRepo") : tt("home.filterPub")}</span>
          <button className="chip on" onClick={() => { setRepo(null); setPub(null); resetPage(); }}>
            {repo ?? `@${pub}`} ✕
          </button>
        </div>
      )}

      {/* 第一步:选分类(主轴) */}
      <div className="filters">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => pickCat(null)}>{tt("home.all")}</button>
        {cats.map((c) => (
          <button key={c.slug} className={`chip ${cat === c.slug ? "on" : ""}`} onClick={() => pickCat(cat === c.slug ? null : c.slug)}>
            {c.label}<span style={cn}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* 第二步:选中分类后展开「分面交叉筛」——每面一行、每面至多选一个,面间 AND(像电商的品牌/尺寸/颜色) */}
      {selectedCat && facetRows.map(({ f, items }, i) => (
        <div className="filters" style={{ marginTop: i === 0 ? 8 : 4 }} key={f.id}>
          <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 700, alignSelf: "center", minWidth: 44 }}>{f.label}</span>
          <button className={`chip ${!sel[f.id] ? "on" : ""}`} onClick={() => pickTag(f.id, null)}>{tt("home.any")}</button>
          {items.map((x) => (
            <button key={x.slug} className={`chip ${sel[f.id] === x.slug ? "on" : ""}`} onClick={() => pickTag(f.id, sel[f.id] === x.slug ? null : x.slug)}>
              #{x.label}<span style={cn}>{x.n}</span>
            </button>
          ))}
        </div>
      ))}

      {/* 分类页不再有站内入口:IA 合并后首页筛选视图功能严格超集(同排序口径+交叉筛+全量分页),
          跳过去只会失去能力;分类页仅作 SEO 落地页与站外深链目标存在 */}
      <div className="filters">
        {/* 排序(非筛选):显式选 Star 数/最新收录时压过相关度;无词浏览恒套 per-repo cap */}
        <select value={sort} aria-label={tt("home.sortLabel")} onChange={(e) => { setSort(e.target.value as SortKey); resetPage(); }}>
          <option value="hot">{tt("home.sortHot")}</option>
          <option value="stars">{tt("home.sortStars")}</option>
          <option value="new">{tt("home.sortNew")}</option>
        </select>
        <span className="fcount">{nf(res.total)} / {nf(meta.total)}</span>
      </div>

      <div className="list" style={busy ? { opacity: 0.55, transition: "opacity .15s" } : undefined}>
        {res.items.map((s) => <SkillRow key={s.id} skill={s} />)}
        {!res.items.length && !busy && <div className="empty">{err ? tt("home.loadFail") : tt("home.noMatch")}</div>}
        {!res.items.length && busy && <div className="empty">{tt("home.loading")}</div>}
      </div>

      {/* 分页:DOM 恒小的关键 —— 永远只渲染当前页;页码窗口 + 跳页输入,331 页也不用逐页点 */}
      <Pager page={res.page} pages={res.pages} goto={goto} locale={locale} />
    </>
  );
}
