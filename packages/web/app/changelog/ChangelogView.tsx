import { readIdxChangelog } from "@/lib/store-server";
import { BackHome } from "@/components/Chrome";
import { t, type Locale, type MsgKey } from "@/lib/i18n";

/** 商店周报共享体(/changelog,ADR 0022 双路由):自动「本周 +N」统计行 + 手写条目(catalog/changelog.json 事实源)。 */
export default function ChangelogView({ locale }: { locale: Locale }) {
  const cl = readIdxChangelog();
  const kind = (k?: string) => (k && ["release", "change", "notice"].includes(k) ? t(locale, `cl.${k}` as MsgKey) : k);

  return (
    <>
      <BackHome />

      <section className="hero">
        <div className="eyebrow">{t(locale, "cl.eyebrow")}</div>
        <h1 className="small">{t(locale, "cl.week")} <span style={{ color: "var(--blue)" }}>+{cl.weekAdded.toLocaleString()}</span> {t(locale, "cl.weekTail")}</h1>
      </section>

      <div className="list" style={{ marginTop: 18 }}>
        {cl.entries.map((e, i) => (
          <div className="row" key={i}>
            <div className="main">
              <div className="nm">{locale === "en" ? e.text_en ?? e.text : e.text}</div>
              <div className="ds">{e.date}{e.kind ? ` · ${kind(e.kind)}` : ""}</div>
            </div>
          </div>
        ))}
        {!cl.entries.length && <div className="empty">{t(locale, "cl.empty")}</div>}
      </div>
    </>
  );
}
