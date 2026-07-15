import { notFound } from "next/navigation";
import { readIdxPacks } from "@/lib/store-server";
import SkillRow from "@/components/SkillRow";
import CopyCmd from "@/components/CopyCmd";
import DlLink from "@/components/DlLink";
import { BackHome } from "@/components/Chrome";
import { t, type Locale } from "@/lib/i18n";
import { artifactForSkill } from "@/lib/artifacts-server";

/** 场景包页共享体(ADR 0022 双路由):名字 + 一句话 + 一条全装命令 + 成员真行。
 *  包 title/tagline/编辑手记是策展内容(人写署名),保持原文——商品侧,不翻。 */
export default function PackView({ id, locale }: { id: string; locale: Locale }) {
  const p = readIdxPacks().find((x) => x.id === id);
  if (!p) notFound();
  const downloadable = p.members
    .map((member) => ({ member, artifact: artifactForSkill(member.id) }))
    .filter((item) => item.artifact != null);

  const cmd = `npx oh-my-skill add ${p.members.map((m) => m.id).join(" ")}`;

  return (
    <>
      <BackHome />

      <section className="detail-hero">
        <h1 className="d-name"><span style={{ fontSize: 26 }}>{p.emoji}</span> {locale === "en" ? p.titleEn ?? p.title : p.title}</h1>
        <p className="d-desc">{locale === "en" ? `${p.taglineEn ?? p.tagline}. ` : `${p.tagline}。`}{t(locale, "pack.suffix", { n: p.members.length })}</p>
        <CopyCmd cmd={cmd} />
        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8 }}>{t(locale, "pack.hashNote")}</div>
        {downloadable.length > 0 && (
          <div className="pack-dl">
            <span className="pack-dl-h">{t(locale, "pack.noTerminal")}</span>
            {downloadable.map(({ member: m, artifact }) => {
              const leaf = m.id.split("/").pop();
              return (
                <DlLink key={m.id} id={m.id} href={artifact!.artifact_url} download={`${leaf}.skill`}>↓ {leaf}.skill</DlLink>
              );
            })}
            {downloadable.length === p.members.length && (
              <DlLink id={`pack:${p.id}`} href={`/dl/packs/${p.id}.zip`} download={`${p.id}-pack.zip`}>{t(locale, "pack.fullZip")}</DlLink>
            )}
            <span className="pack-dl-note">{t(locale, "pack.dlNote")}</span>
          </div>
        )}
      </section>

      {p.editorNote && (
        <section className="editor-note">
          <div className="en-label">{t(locale, "pack.editorNote")}</div>
          {/* 手记译文(ADR 0022 修订):忠实翻译不改署名;缺英文回退中文原文 */}
          <p className="en-text">{locale === "en" ? p.editorNote.text_en ?? p.editorNote.text : p.editorNote.text}</p>
          <div className="en-sign">—— {p.editorNote.author} · {p.editorNote.date}</div>
        </section>
      )}

      <div className="list" style={{ marginTop: 14 }}>
        {p.members.map((s) => <SkillRow key={s.id} skill={s} />)}
      </div>
    </>
  );
}
