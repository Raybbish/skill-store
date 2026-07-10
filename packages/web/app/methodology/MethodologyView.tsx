import Link from "next/link";
import { allCollections } from "@/lib/data";
import { fmtInstalls } from "@/lib/skill-utils";
import { readIdxMeta } from "@/lib/store-server";
import { BackHome } from "@/components/Chrome";
import { localePath, t, type Locale } from "@/lib/i18n";

/** 收录比例条:上架数占源内总量(纯视觉,无文字解释) */
function Ratio({ sampled, total }: { sampled: number; total: number }) {
  const pct = (sampled / Math.max(1, total)) * 100;
  const label = pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
      <div style={{ flex: "0 0 120px", height: 3, borderRadius: 2, background: "var(--hair)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(1.5, pct)}%`, height: "100%", background: "var(--blue)" }} />
      </div>
      <span style={{ fontSize: 11.5, color: "var(--faint)", fontFamily: "var(--mono)" }}>{label}</span>
    </div>
  );
}

/** 收录页共享体(ADR 0022 双路由):数据自己说话——数字、比例条、来源列表。 */
export default function MethodologyView({ locale }: { locale: Locale }) {
  const collections = allCollections();
  const meta = readIdxMeta();
  const upstreamTotal = collections.reduce((a, c) => a + c.skillCount, 0);

  return (
    <>
      <BackHome />

      <section className="hero">
        <div className="eyebrow">{t(locale, "cov.eyebrow")}</div>
        <h1 className="small">{meta.total.toLocaleString()} <span style={{ color: "var(--faint)", fontWeight: 600 }}>/ {(meta.total + upstreamTotal).toLocaleString()}</span></h1>
        <div className="d-stats">
          <div><b>{(meta.total + upstreamTotal).toLocaleString()}</b><span>{t(locale, "cov.observed")}</span></div>
          <div><b>{meta.total.toLocaleString()}</b><span>{t(locale, "cov.listed")}</span></div>
          <div><b>{collections.length}</b><span>{t(locale, "cov.sources")}</span></div>
        </div>
      </section>

      <div className="list" style={{ marginTop: 18 }}>
        {collections.map((c) => (
          <div className="row" key={c.id}>
            <div className="main">
              <div className="nm">{c.id}</div>
              {c.description && <div className="ds">{c.description}</div>}
              <div className="ds" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                {c.skillCount.toLocaleString()}{c.blocked ? ` · ${t(locale, "cov.notItemized")}` : ` · ${t(locale, "cov.listedN", { n: c.sampledCount })}`}
              </div>
              {!c.blocked && <Ratio sampled={c.sampledCount} total={c.skillCount} />}
            </div>
            <div className="rt">
              {c.stars != null && <div className="score"><span className="gold">★</span> {fmtInstalls(c.stars)}</div>}
              {!c.blocked && <Link href={`${localePath(locale, "/")}?repo=${encodeURIComponent(c.id)}`} className="go">{t(locale, "cov.listedLink")}</Link>}
              <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>{t(locale, "cov.source")}</a>
            </div>
          </div>
        ))}
        {!collections.length && <div className="empty">{t(locale, "cov.empty")}</div>}
      </div>

      {collections.some((c) => c.blocked) && (
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--faint)", fontFamily: "var(--mono)" }}>
          {t(locale, "cov.footnote")}
        </p>
      )}
    </>
  );
}
