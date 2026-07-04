import Link from "next/link";
import { notFound } from "next/navigation";
import { allSkills, getSkill, fmtInstalls } from "@/lib/data";
import { threadVMsForSkill } from "@/lib/community";
import SkillCommunity from "./SkillCommunity";
import InstallBox from "./InstallBox";

export function generateStaticParams() {
  return allSkills().map((s) => ({ owner: s.owner, repo: s.repo, name: s.name }));
}

export default async function SkillPage({ params }: { params: Promise<{ owner: string; repo: string; name: string }> }) {
  const { owner, repo, name } = await params;
  const s = getSkill(owner, repo, name);
  if (!s) notFound();

  const my = threadVMsForSkill(s.id);
  const help = my.filter((t) => t.board === "help");
  const challenge = my.filter((t) => t.board === "challenge");
  const show = my.filter((t) => t.board === "show");

  return (
    <>
      <Link href="/" className="back">‹ 首页</Link>

      <section className="detail-hero">
        <h1 className="d-name">{s.name}</h1>
        <div className="d-pub">
          <Link href={`/publisher/${s.publisher}/`}>@{s.publisher}</Link>
          {s.curatedBy && s.curatedBy.length > 0 && <span className="d-tag">★ 社区精选</span>}
        </div>
        <p className="d-desc">{s.description ?? "(无描述)"}</p>
        {/* 场景词全量展示(详情页不裁词频);点击 = 以该词搜索,不进 facet(ADR-B) */}
        {s.sceneTags && s.sceneTags.length > 0 && (
          <div className="d-scene">
            {s.sceneTags.map((w) => (
              <Link key={w} href={`/?q=${encodeURIComponent(w)}`} className="sc">{w}</Link>
            ))}
          </div>
        )}
        {/* fit_line 放安装按钮上方(决策位):最典型那类用户的处境 */}
        {s.fitLine && <p className="d-fit">{s.fitLine}</p>}
        <InstallBox skill={s} />
        <div className="d-stats">
          {s.installs != null && <div><b>{fmtInstalls(s.installs)}</b><span>安装量</span></div>}
          <div><b>{s.stars ?? "–"}</b><span>GitHub stars</span></div>
          <div><b>~{Math.round(s.tokens / 100) / 10}K</b><span>token / 次</span></div>
          <div><b>{s.hosting === "mirrored" ? "镜像" : "索引"}</b><span>托管</span></div>
        </div>
      </section>

      <SkillCommunity help={help} challenge={challenge} show={show} />
    </>
  );
}
