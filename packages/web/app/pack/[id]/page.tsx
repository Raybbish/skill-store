import Link from "next/link";
import { notFound } from "next/navigation";
import { readIdxPacks } from "@/lib/store-server";
import SkillRow from "@/components/SkillRow";
import CopyCmd from "@/components/CopyCmd";

/** 场景包页:名字 + 一句话 + 一条全装命令 + 成员真行。没有任何需要理解的概念。 */
export function generateStaticParams() {
  return readIdxPacks().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = readIdxPacks().find((x) => x.id === id);
  return { title: `${p?.title ?? id} · oh-my-skill`, description: p?.tagline };
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = readIdxPacks().find((x) => x.id === id);
  if (!p) notFound();

  const cmd = `npx oh-my-skill add ${p.members.map((m) => m.id).join(" ")}`;

  return (
    <>
      <Link href="/" className="back">‹ 首页</Link>

      <section className="detail-hero">
        <h1 className="d-name"><span style={{ fontSize: 26 }}>{p.emoji}</span> {p.title}</h1>
        <p className="d-desc">{p.tagline}。{p.members.length} 件套,装一次就够。</p>
        <CopyCmd cmd={cmd} />
        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8 }}>安装时逐个校验内容哈希;每个成员也可以单独安装。</div>
      </section>

      {p.editorNote && (
        <section className="editor-note">
          <div className="en-label">编辑手记</div>
          <p className="en-text">{p.editorNote.text}</p>
          <div className="en-sign">—— {p.editorNote.author} · {p.editorNote.date}</div>
        </section>
      )}

      <div className="list" style={{ marginTop: 14 }}>
        {p.members.map((s) => <SkillRow key={s.id} skill={s} />)}
      </div>
    </>
  );
}
