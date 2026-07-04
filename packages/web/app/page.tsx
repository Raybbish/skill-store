import Link from "next/link";
import { allSkills, byPopularity } from "@/lib/data";
import { toCard } from "@/lib/store";
import SkillRow from "@/components/SkillRow";

const OFFICIAL = new Set(["anthropics", "vercel-labs", "microsoft", "supabase", "larksuite", "remotion-dev"]);

export default function Home() {
  const skills = allSkills();
  // 客户端组件只喂瘦卡(toCard),别把全量 Skill(evidence 等)序列化进页面(ADR 0007)
  const official = skills.filter((s) => OFFICIAL.has(s.publisher) && s.status === "pass").sort(byPopularity).slice(0, 6);
  const featured = (official.length ? official : skills.slice(0, 6)).map(toCard);
  const trending = [...skills].sort(byPopularity).slice(0, 6).map(toCard);

  return (
    <>
      <section className="hero">
        <div className="eyebrow">Agent Skills 商店</div>
        <h1>给你的 agent,<br />找对 <span className="hl">skill</span></h1>
        <Link href="/browse/" className="searchbar">
          <span>🔍</span>
          <span style={{ color: "var(--faint)", flex: 1 }}>搜索 {skills.length} 个 skill…</span>
          <span className="go">浏览</span>
        </Link>
      </section>

      <div className="sec">
        <div className="sec-h"><h2>编辑精选</h2><span className="k">已验证发布者</span><Link href="/browse/">查看全部 ›</Link></div>
        <div className="list">{featured.map((s) => <SkillRow key={s.id} skill={s} />)}</div>
      </div>

      <div className="sec">
        <div className="sec-h"><h2>热门</h2><span className="k">GitHub 人气 · 按仓库归一</span></div>
        <div className="list">{trending.map((s, i) => <SkillRow key={s.id} skill={s} rank={i + 1} />)}</div>
      </div>
    </>
  );
}
