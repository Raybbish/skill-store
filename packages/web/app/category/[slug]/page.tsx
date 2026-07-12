import Link from "next/link";
import { notFound } from "next/navigation";
import { skillsByLabel } from "@/lib/data";
import { applyRepoCap, byPopularity } from "@/lib/skill-utils";
import { toCard } from "@/lib/store";
import { labelBySlug, allSlugs, featuredLabels } from "@skill-store/schemas";
import SkillRow from "@/components/SkillRow";
import { L } from "@/lib/i18n/client";

/** 静态分类页只渲染前 CAP 条(热门序);全量浏览走 /browse/ 深链分页(ADR 0007) */
const CAP = 150;

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
    description: `${name} 下的 Agent Skills —— 浏览、比较、一键安装。`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = labelBySlug(slug);
  const isUncat = slug === "uncategorized";
  if (!def && !isUncat) notFound();

  const skills = skillsByLabel(slug);
  const featured = def?.featured ?? false;
  const kind = <L zh={isUncat ? "待归类" : featured ? "分类" : "标签"} en={isUncat ? "To categorize" : featured ? "Category" : "Tag"} />;
  const name = def ? <L zh={def.label_zh} en={def.label_en} /> : isUncat ? <L zh="未分类" en="Uncategorized" /> : slug;
  // 热门序 + 每仓上限;客户端组件只喂瘦卡,页面体积与分类大小脱钩
  const shown = applyRepoCap([...skills].sort(byPopularity)).slice(0, CAP).map(toCard);
  const truncated = skills.length > shown.length;

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{kind}{!featured && !isUncat ? <L zh=" · 跨分类横切面" en=" · cross-category facet" /> : ""}</div>
        <h1 className="small">
          {featured || isUncat ? name : <>#{name}</>}
          <span style={{ color: "var(--faint)", fontWeight: 600, fontSize: 20, marginLeft: 10 }}>{skills.length}</span>
        </h1>
      </section>

      {!featured && !isUncat && (
        <div style={{ background: "var(--soft, #f2f5ff)", borderRadius: 12, padding: "11px 15px", fontSize: 13, color: "var(--sub)", margin: "6px 0 2px" }}>
          <L
            zh={<>这是<b>标签</b>(不是顶级分类),用于桶内二级筛选。够量且语义独立后,会由 <code>promote</code> job 自动提议升为分类 —— 升级不改本页 URL。</>}
            en={<>This is a <b>tag</b> (not a top-level category), used for secondary filtering. Once large and semantically independent, the <code>promote</code> job proposes upgrading it — the URL never changes.</>}
          />
        </div>
      )}
      {isUncat && (
        <div style={{ background: "#fdf3e4", borderRadius: 12, padding: "11px 15px", fontSize: 13, color: "var(--sub)", margin: "6px 0 2px" }}>
          <L
            zh={<>启发式判不准(低分 / 平票)的条目,进人工补标;补标后锁定(<code>category_locked</code>),采集不再覆盖。</>}
            en={<>Entries the heuristics couldn't classify (low score / tie), pending manual labeling; once labeled they are locked (<code>category_locked</code>) and ingest won't overwrite.</>}
          />
        </div>
      )}

      <div className="filters" style={{ marginTop: 14 }}>
        <Link href="/" className="chip"><L zh="← 全部 skill" en="← All skills" /></Link>
        {featuredLabels().map((l) => (
          <Link key={l.slug} href={`/category/${l.slug}/`} className={`chip ${l.slug === slug ? "on" : ""}`}><L zh={l.label_zh} en={l.label_en} /></Link>
        ))}
      </div>

      <div className="list" style={{ marginTop: 10 }}>
        {shown.map((s) => <SkillRow key={s.id} skill={s} />)}
        {!shown.length && <div className="empty"><L zh="暂无 skill" en="No skills yet" /></div>}
      </div>

      {truncated && (
        <div className="filters" style={{ marginTop: 16, justifyContent: "center" }}>
          <Link href={`/?${featured ? "cat" : "tag"}=${slug}`} className="chip">
            <L zh={`在浏览页看全部 ${skills.length.toLocaleString()} 条(分页)›`} en={`Browse all ${skills.length.toLocaleString()} (paginated) ›`} />
          </Link>
        </div>
      )}
    </>
  );
}
