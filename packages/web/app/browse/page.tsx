import { allSkills, allCollections } from "@/lib/data";
import BrowseClient from "./BrowseClient";

export default function Browse() {
  const collections = allCollections();
  return (
    <>
      <BrowseClient skills={allSkills()} />
      {collections.length > 0 && (
        <>
          <div className="h2" style={{ marginTop: 28 }}>批量源合集</div>
          <div className="h2-sub">
            这些仓库包含大量 SKILL.md(生成器产出或聚合搬运),本店只折叠采样收录少量条目;全量请移步上游仓库
          </div>
          <div className="card" style={{ padding: "8px 14px" }}>
            {collections.map((c) => (
              <a href={c.url} key={c.id} className="srow" target="_blank" rel="noopener noreferrer">
                <div className="s-icon">📦</div>
                <div className="info">
                  <div className="n">{c.id}</div>
                  <div className="tg">共 {c.skillCount.toLocaleString()} 个 skill · 已采样收录 {c.sampledCount} 条</div>
                  <div className="badges">
                    {c.stars != null && <span className="mini">★ {c.stars.toLocaleString()}</span>}
                    <span className="mini">上游仓库 ↗</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
}
