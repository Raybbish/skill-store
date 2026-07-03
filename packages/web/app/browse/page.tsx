import { allSkills, allCollections } from "@/lib/data";
import { featuredLabels, tagLabels } from "@skill-store/schemas";
import BrowseClient from "./BrowseClient";

export default function Browse() {
  const skills = allSkills();
  const collections = allCollections();
  // 分类 / 标签的货架数量(分类=主分类命中;标签=tags 命中)
  const count = (slug: string) => skills.filter((s) => s.category === slug || (s.tags ?? []).includes(slug)).length;
  const cats = featuredLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: count(l.slug) }));
  const tags = tagLabels().map((l) => ({ slug: l.slug, label: l.label_zh, n: count(l.slug) })).filter((t) => t.n > 0);

  return (
    <>
      <BrowseClient skills={skills} cats={cats} tags={tags} />
      {collections.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>批量源合集</h2><span className="k">折叠采样 · 全量见上游</span></div>
          <div className="list">
            {collections.map((c) => (
              <a href={c.url} key={c.id} className="row" target="_blank" rel="noopener noreferrer">
                <div className="main">
                  <div className="nm">{c.id}</div>
                  <div className="ds">共 {c.skillCount.toLocaleString()} 个 skill · 已采样收录 {c.sampledCount} 条</div>
                </div>
                <div className="rt">
                  {c.stars != null && <div className="score"><span className="gold">★</span> {c.stars.toLocaleString()}</div>}
                  <span className="go">上游 ↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
