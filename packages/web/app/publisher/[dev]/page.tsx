import { notFound } from "next/navigation";
import { fmtInstalls } from "@/lib/data";
import { listPublishers, getPublisherView } from "@/lib/publishers";
import SkillRow from "@/components/SkillRow";
import { BackHome } from "@/components/Chrome";
import { L } from "@/lib/i18n/client";

export function generateStaticParams() {
  return listPublishers().map((dev) => ({ dev }));
}

export async function generateMetadata({ params }: { params: Promise<{ dev: string }> }) {
  const { dev } = await params;
  const v = getPublisherView(decodeURIComponent(dev));
  if (!v) return {};
  return { title: `@${v.pub} · oh-my-skill`, description: `@${v.pub} 的作品集:已上架 ${v.works.length} 个 skill。` };
}

export default async function PublisherPage({ params }: { params: Promise<{ dev: string }> }) {
  const { dev } = await params;
  const v = getPublisherView(decodeURIComponent(dev));
  if (!v) notFound();

  return (
    <>
      <BackHome />

      <section className="detail-hero">
        <h1 className="d-name">{v.pub}</h1>
        <div className="d-pub">@{v.pub}</div>
        <div className="d-stats">
          <div><b>{v.works.length}</b><span><L zh="已上架" en="listed" /></span></div>
          <div><b>{fmtInstalls(v.totalInstalls)}</b><span><L zh="累计安装" en="total installs" /></span></div>
        </div>
      </section>

      <div className="sec">
        <div className="sec-h"><h2><L zh="作品集" en="Works" /></h2></div>
        <div className="list">{v.works.map((s) => <SkillRow key={s.id} skill={s} />)}</div>
      </div>
    </>
  );
}
