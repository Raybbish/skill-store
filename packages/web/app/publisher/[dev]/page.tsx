import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtInstalls } from "@/lib/data";
import { listPublishers, getPublisherView } from "@/lib/community";
import ThreadRow from "@/components/ThreadRow";
import SkillRow from "@/components/SkillRow";

export function generateStaticParams() {
  return listPublishers().map((dev) => ({ dev }));
}

export default async function PublisherPage({ params }: { params: Promise<{ dev: string }> }) {
  const { dev } = await params;
  const v = getPublisherView(decodeURIComponent(dev));
  if (!v) notFound();

  return (
    <>
      <Link href="/browse/" className="back">‹ 浏览</Link>

      <section className="detail-hero">
        <h1 className="d-name">{v.pub}{v.verified && <span className="vbadge">已认证发布者 ✓</span>}</h1>
        <p className="d-desc">{v.bio}</p>
        <div className="d-pub">@{v.pub} · 加入于 {v.joined}</div>
        <div className="d-stats">
          <div><b>{v.works.length}</b><span>已上架</span></div>
          <div><b>{fmtInstalls(v.totalInstalls)}</b><span>累计安装</span></div>
          <div><b>{v.respHrs != null ? `${v.respHrs}h` : "–"}</b><span>求助响应</span></div>
          <div><b>{v.chalWins}</b><span>评测复现</span></div>
          <div><b>0</b><span>恶意记录</span></div>
        </div>
      </section>

      <div className="sec">
        <div className="sec-h"><h2>作品集</h2><span className="k">每个带认证图标</span></div>
        <div className="list">{v.works.map((s) => <SkillRow key={s.id} skill={s} />)}</div>
      </div>

      <div className="sec">
        <div className="sec-h"><h2>评测挑战记录</h2></div>
        <div className="list">{v.challenge.length ? v.challenge.map((t, i) => <ThreadRow vm={t} key={i} />) : <div className="empty">暂无挑战记录</div>}</div>
      </div>
    </>
  );
}
