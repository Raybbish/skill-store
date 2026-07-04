"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { byPopularity, type Skill } from "@/lib/data";
import SkillRow from "@/components/SkillRow";

type Chip = { slug: string; label: string; n: number };
const cn = { color: "var(--faint)", marginLeft: 4, fontWeight: 600 } as const;

export default function BrowseClient({ skills, cats, tags }: { skills: Skill[]; cats: Chip[]; tags: Chip[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null); // 第一步:主分类(每个 skill 归一个)
  const [tag, setTag] = useState<string | null>(null); // 第二步:分类内细分标签(横切,选填)
  const [safeOnly, setSafeOnly] = useState(false);

  // 细分标签只在选了分类后出现,且只列在该分类内确有成员的标签(计数=分类内数量)
  const subTags = useMemo<Chip[]>(() => {
    if (!cat) return [];
    return tags
      .map((t) => ({ slug: t.slug, label: t.label, n: skills.filter((s) => s.category === cat && (s.tags ?? []).includes(t.slug)).length }))
      .filter((t) => t.n > 0);
  }, [cat, tags, skills]);

  const pickCat = (slug: string | null) => { setCat(slug); setTag(null); };

  const list = useMemo(() => {
    let l = skills.slice();
    if (cat) l = l.filter((s) => s.category === cat);
    if (tag) l = l.filter((s) => (s.tags ?? []).includes(tag));
    if (safeOnly) l = l.filter((s) => s.risk.network?.present !== true);
    if (q) {
      const t = q.toLowerCase();
      l = l.filter((s) => (s.id + (s.description ?? "")).toLowerCase().includes(t));
    }
    l.sort(byPopularity);
    return l;
  }, [skills, q, cat, tag, safeOnly]);

  const selectedCat = cats.find((c) => c.slug === cat);

  return (
    <>
      <section className="hero"><div className="eyebrow">浏览</div><h1 className="small">全部 skill</h1></section>

      <div className="searchbar" style={{ marginTop: 4 }}>
        <span>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 skill…" />
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
          <button className={`chip ${!tag ? "on" : ""}`} onClick={() => setTag(null)}>不限</button>
          {subTags.map((t) => (
            <button key={t.slug} className={`chip ${tag === t.slug ? "on" : ""}`} onClick={() => setTag(tag === t.slug ? null : t.slug)}>
              #{t.label}<span style={cn}>{t.n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="filters">
        <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>热门排序</span>
        <button className={`chip ${safeOnly ? "on" : ""}`} onClick={() => setSafeOnly(!safeOnly)}>🛡️ 仅无网络请求</button>
        {selectedCat && <Link href={`/category/${selectedCat.slug}/`} className="chip">看「{selectedCat.label}」分类页 ↗</Link>}
        <span className="fcount">{list.length} / {skills.length}</span>
      </div>

      <div className="list">
        {list.map((s) => <SkillRow key={s.id} skill={s} />)}
        {!list.length && <div className="empty">无匹配结果</div>}
      </div>
    </>
  );
}
