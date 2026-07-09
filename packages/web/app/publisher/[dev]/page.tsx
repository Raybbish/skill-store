import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtInstalls } from "@/lib/data";
import { listPublishers, getPublisherView } from "@/lib/publishers";
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
      <Link href="/" className="back">‹ 首页</Link>

      <section className="detail-hero">
        <h1 className="d-name">{v.pub}</h1>
        <div className="d-pub">@{v.pub}</div>
        <div className="d-stats">
          <div><b>{v.works.length}</b><span>已上架</span></div>
          <div><b>{fmtInstalls(v.totalInstalls)}</b><span>累计安装</span></div>
        </div>
      </section>

      <div className="sec">
        <div className="sec-h"><h2>作品集</h2></div>
        <div className="list">{v.works.map((s) => <SkillRow key={s.id} skill={s} />)}</div>
      </div>
    </>
  );
}
