import Link from "next/link";
import { notFound } from "next/navigation";
import { readIdxPacks } from "@/lib/store-server";
import SkillRow from "@/components/SkillRow";
import CopyCmd from "@/components/CopyCmd";
import DlLink from "@/components/DlLink";

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
        {p.members.some((m) => m.dl) && (
          <div className="pack-dl">
            <span className="pack-dl-h">不用终端?</span>
            {p.members.filter((m) => m.dl).map((m) => {
              const leaf = m.id.split("/").pop();
              return (
                <DlLink key={m.id} id={m.id} href={`/dl/${m.id}.skill`} download={`${leaf}.skill`}>↓ {leaf}.skill</DlLink>
              );
            })}
            {p.members.every((m) => m.dl) && (
              <DlLink id={`pack:${p.id}`} href={`/dl/packs/${p.id}.zip`} download={`${p.id}-pack.zip`}>↓ 整包 .zip</DlLink>
            )}
            <span className="pack-dl-note">.skill 双击或拖进 Claude 即装;整包 zip 解压后把文件夹放进你工具的技能目录</span>
          </div>
        )}
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
