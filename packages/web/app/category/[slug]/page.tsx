import Link from "next/link";
import { notFound } from "next/navigation";
import { skillsByLabel } from "@/lib/data";
import { labelBySlug, allSlugs, featuredLabels } from "@skill-store/schemas";
import SkillRow from "@/components/SkillRow";

/**
 * 分类页 = 标签页,共用同一模板。featured 标签渲染成「分类」,featured:false 渲染成「标签」,
 * uncategorized 渲染成「待归类」。因此 promote 把某标签升成分类时,只是这页的呈现从「标签」变「分类」,
 * URL(/category/<slug>/)不变 —— SEO 不丢。
 */
export function generateStaticParams() {
  return [...allSlugs(), "uncategorized"].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = labelBySlug(slug);
  const name = def?.label_zh ?? (slug === "uncategorized" ? "未分类" : slug);
  return {
    title: `${name} · oh-my-skill`,
    description: `${name} 下的 Agent Skills —— 浏览、比较、一键安装,每个都带权限披露与审计。`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = labelBySlug(slug);
  const isUncat = slug === "uncategorized";
  if (!def && !isUncat) notFound();

  const skills = skillsByLabel(slug);
  const featured = def?.featured ?? false;
  const kind = isUncat ? "待归类" : featured ? "分类" : "标签";
  const name = def?.label_zh ?? (isUncat ? "未分类" : slug);

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{kind}{!featured && !isUncat ? " · 跨分类横切面" : ""}</div>
        <h1 className="small">
          {featured ? name : isUncat ? "未分类" : `#${name}`}
          <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 20, marginLeft: 10 }}>{skills.length}</span>
        </h1>
      </section>

      {!featured && !isUncat && (
        <div style={{ background: "var(--soft, #f2f5ff)", borderRadius: 12, padding: "11px 15px", fontSize: 13, color: "var(--sub)", margin: "6px 0 2px" }}>
          这是<b>标签</b>(不是顶级分类),用于桶内二级筛选。够量且语义独立后,会由 <code>promote</code> job 自动提议升为分类 —— 升级不改本页 URL。
        </div>
      )}
      {isUncat && (
        <div style={{ background: "#fdf3e4", borderRadius: 12, padding: "11px 15px", fontSize: 13, color: "var(--sub)", margin: "6px 0 2px" }}>
          启发式判不准(低分 / 平票)的条目,进人工补标;补标后锁定(<code>category_locked</code>),采集不再覆盖。
        </div>
      )}

      <div className="filters" style={{ marginTop: 14 }}>
        <Link href="/browse/" className="chip">← 全部 skill</Link>
        {featuredLabels().map((l) => (
          <Link key={l.slug} href={`/category/${l.slug}/`} className={`chip ${l.slug === slug ? "on" : ""}`}>{l.label_zh}</Link>
        ))}
      </div>

      <div className="list" style={{ marginTop: 10 }}>
        {skills.map((s) => <SkillRow key={s.id} skill={s} />)}
        {!skills.length && <div className="empty">该{kind}下暂无 skill</div>}
      </div>
    </>
  );
}
