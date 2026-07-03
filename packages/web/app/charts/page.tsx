import { allSkills } from "@/lib/data";
import SkillRow from "@/components/SkillRow";

export default function Charts() {
  const byInstall = [...allSkills()].filter((s) => s.installs != null).sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0)).slice(0, 10);
  return (
    <>
      <section className="hero">
        <div className="eyebrow">榜单</div>
        <h1 className="small">大家都在装</h1>
        <p className="lede">按累计安装量排名。可复现评测榜开发中——分数将带 runner / 模型元数据,可复现、可挑战。</p>
      </section>
      <div className="list">
        {byInstall.map((s, i) => <SkillRow key={s.id} skill={s} rank={i + 1} />)}
      </div>
    </>
  );
}
