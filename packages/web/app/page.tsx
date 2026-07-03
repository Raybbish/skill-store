import Link from "next/link";
import { allSkills } from "@/lib/data";
import SkillRow from "@/components/SkillRow";

const OFFICIAL = new Set(["anthropics", "vercel-labs", "microsoft", "supabase", "larksuite", "remotion-dev"]);

export default function Home() {
  const skills = allSkills();
  const official = skills.filter((s) => OFFICIAL.has(s.publisher) && s.status === "pass").sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).slice(0, 6);
  const featured = official.length ? official : skills.slice(0, 6);
  const trending = [...skills].sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).slice(0, 6);

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
        <div className="sec-h"><h2>大家都在装</h2><span className="k">流行度 · 安装量</span></div>
        <div className="list">{trending.map((s, i) => <SkillRow key={s.id} skill={s} rank={i + 1} />)}</div>
      </div>
    </>
  );
}
