"use client";
/**
 * 作者工作台(ADR 0023「作者自助导入」):GitHub 登录 → ①批量认领已收录(ADR 0006 的
 * 「静默预填」落地:循环 claim_skill,服务端逐条裁决)②扫描/手填提交未收录仓(submit_repo RPC)。
 * 双层门:claims flag off 时本页只说「尚未开放」,服务端 RPC 同步拒绝。
 * 身份 ≠ 背书:认领只陈述归属;提交只入待收录队列,收录与否以货架为准。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, githubAuthorizeUrl, githubToken, sessionFromUrlHash, signOut, type Session } from "@/lib/auth";
import { claimSkill, claimsConfigured, claimsEnabled, listClaimsByLogin } from "@/lib/claims";
import { mySubmissions, scanGithubSkillRepos, submitRepo, type Submission } from "@/lib/submissions";
import { createStore } from "@/lib/store-typesense";
import type { SkillCard } from "@/lib/store";
import type { MsgKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

const CLAIM_REASON: Record<string, MsgKey> = {
  "no-github-identity": "claim.noGithub",
  "aggregator-source": "claim.aggregator",
  "already-claimed": "claim.claimed",
  "skill-not-found": "claim.notFound",
  "not-signed-in": "claim.signInFirst",
  "claims-disabled": "st.off",
};
const SUBMIT_REASON: Record<string, MsgKey> = {
  "bad-repo": "sub.badRepo",
  "already-listed": "sub.listed",
  "already-submitted": "sub.dup",
  "rate-limited": "sub.rate",
  "no-github-identity": "st.needGh",
  "not-signed-in": "claim.signInFirst",
  "claims-disabled": "st.off",
};

export default function StudioClient() {
  const tt = useT();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [works, setWorks] = useState<SkillCard[] | null>(null);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [rowMsg, setRowMsg] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<Map<string, Submission["status"]>>(new Map());
  const [scanned, setScanned] = useState<string[] | null>(null);
  const [scanMsg, setScanMsg] = useState("");
  const [manual, setManual] = useState("");
  const [hasTok, setHasTok] = useState(false); // provider token 在不在(挂载后读,防 SSR 水合错配)

  const login = session?.user.github_login;

  useEffect(() => {
    if (!claimsConfigured()) { setEnabled(false); return; }
    void claimsEnabled().then(setEnabled);
    void (async () => {
      const s = (await sessionFromUrlHash()) ?? (await getSession());
      setSession(s);
      setHasTok(Boolean(githubToken())); // OAuth 回跳时 sessionFromUrlHash 刚存好 token,此刻再读
      if (s?.user.github_login) await load(s, s.user.github_login);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 已收录作品(取数走 SkillStore 缝,static/typesense 通吃)+ 认领与提交现状 */
  async function load(s: Session, gh: string) {
    const store = createStore();
    const acc: SkillCard[] = [];
    let page = 1, pages = 1;
    do {
      const r = await store.search("", { publisher: gh }, page);
      acc.push(...r.items.filter((c) => c.owner.toLowerCase() === gh.toLowerCase()));
      pages = r.pages; page += 1;
    } while (page <= pages && page <= 10); // 单作者 >300 条不合常理,防御性封顶
    setWorks(acc);
    setClaimed(new Set((await listClaimsByLogin(gh)).map((c) => c.skill_id)));
    setSubs(new Map((await mySubmissions(s)).map((x) => [x.repo.toLowerCase(), x.status])));
  }

  const ghSignIn = () => { window.location.href = githubAuthorizeUrl(window.location.href); };

  function claimReasonText(reason: string): string {
    if (reason.startsWith("owner-mismatch:")) return tt("claim.mismatch", { got: reason.split(":")[1], want: login ?? "" });
    const k = CLAIM_REASON[reason];
    return k ? tt(k) : tt("claim.fail", { s: reason });
  }
  function submitReasonText(reason: string): string {
    if (reason.startsWith("owner-mismatch:")) return tt("sub.notYours", { login: login ?? "" });
    const k = SUBMIT_REASON[reason];
    return k ? tt(k) : tt("claim.fail", { s: reason });
  }

  async function claimOne(s: Session, id: string) {
    const r = await claimSkill(s, id);
    if (r.ok) {
      setClaimed((prev) => new Set(prev).add(id));
      setRowMsg((m) => ({ ...m, [id]: "" }));
    } else {
      setRowMsg((m) => ({ ...m, [id]: claimReasonText(r.reason) }));
    }
  }

  async function claimAll() {
    if (!session || !works) return;
    setBusy(true);
    for (const w of works) {
      if (claimed.has(w.id) || w.bulkSource) continue;
      await claimOne(session, w.id); // 顺序请求:量小(个位数为常态),且认领 RPC 无批量口
    }
    setBusy(false);
  }

  async function scan() {
    if (!login) return;
    const tok = githubToken();
    if (!tok) { setScanMsg(tt("st.scanAuth")); return; }
    setBusy(true); setScanMsg("");
    try {
      const listedRepos = new Set((works ?? []).map((w) => `${w.owner}/${w.repo}`.toLowerCase()));
      const found = await scanGithubSkillRepos(login, tok);
      setScanned(found.filter((r) => !listedRepos.has(r.toLowerCase())));
    } catch (e) {
      setScanMsg(tt("st.scanFail", { s: (e as Error).message }));
    }
    setBusy(false);
  }

  async function submitOne(repo: string) {
    if (!session) return;
    const r = await submitRepo(session, repo);
    if (r.ok || r.reason === "already-submitted") {
      setSubs((prev) => new Map(prev).set(repo.toLowerCase(), "pending"));
      setScanMsg("");
    } else {
      setScanMsg(submitReasonText(r.reason));
    }
  }

  async function submitAll() {
    if (!scanned) return;
    setBusy(true);
    for (const r of scanned) if (!subs.has(r.toLowerCase())) await submitOne(r);
    setBusy(false);
  }

  const hero = (
    <section className="hero">
      <div className="eyebrow">{tt("st.eyebrow")}</div>
      <h1 className="small">{tt("st.title")}</h1>
    </section>
  );

  // env 未配 / 开关 off:只说事实(与详情页认领入口同一门禁口径)
  if (enabled === null) return <>{hero}<div className="rev-empty">{tt("st.loading")}</div></>;
  if (!enabled) return <>{hero}<div className="rev-empty">{tt("st.off")}</div></>;

  // 未带 GitHub 身份:说明 + 登录(已有邮箱会话也走这条——作者功能只认 GitHub 身份)
  if (!login) {
    return (
      <>
        {hero}
        <div className="rev-form">
          <p className="rev-tip">{session ? tt("st.needGh") : tt("st.intro")}</p>
          <div className="rev-row">
            <button className="cp" onClick={ghSignIn}>{tt("gh.signIn")}</button>
            {session && <button className="rev-x" onClick={() => { signOut(); setSession(null); }}>{tt("talk.signOut")}</button>}
          </div>
        </div>
      </>
    );
  }

  const unclaimed = (works ?? []).filter((w) => !claimed.has(w.id) && !w.bulkSource);

  return (
    <>
      {hero}
      <div className="rev-meta" style={{ marginBottom: 16 }}>
        {tt("talk.signedAs", { email: `@${login}` })} · <button className="rev-x" onClick={() => { signOut(); setSession(null); setWorks(null); }}>{tt("talk.signOut")}</button>
      </div>

      {/* ① 已收录:批量认领 */}
      <div className="sec">
        <div className="sec-h">
          <h2>{tt("st.listed", { login })}</h2>
          {unclaimed.length > 1 && (
            <button className="cp" disabled={busy} onClick={() => void claimAll()}>
              {busy ? tt("claim.busy") : `${tt("st.claimAll")} (${unclaimed.length})`}
            </button>
          )}
        </div>
        {works === null ? (
          <div className="rev-empty">{tt("st.loading")}</div>
        ) : works.length === 0 ? (
          <div className="rev-empty">{tt("st.listedNone", { login })}</div>
        ) : (
          <div className="rev-list">
            {works.map((w) => (
              <div key={w.id} className="rev-item">
                <div className="rev-line1">
                  <Link href={`/skill/${w.id}/`}><b>{w.name}</b></Link>
                  <span className="rev-when">{w.id}</span>
                  {claimed.has(w.id) ? (
                    <span className="d-tag claim-tag">{tt("st.claimedTag")}</span>
                  ) : w.bulkSource ? (
                    <span className="rev-when">{tt("st.bulkNo")}</span>
                  ) : (
                    <button className="cp" disabled={busy} onClick={() => session && void claimOne(session, w.id)}>{tt("st.claim")}</button>
                  )}
                </div>
                {rowMsg[w.id] && <p className="rev-err">{rowMsg[w.id]}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ② 未收录:扫描 + 手填提交 */}
      <div className="sec">
        <div className="sec-h"><h2>{tt("st.scanH")}</h2></div>
        <div className="rev-form">
          {scanned === null ? (
            <div className="rev-row">
              <button className="cp" disabled={busy} onClick={() => void scan()}>{busy ? tt("st.scanning") : tt("st.scan")}</button>
              {!hasTok && <span className="rev-tip">{tt("st.scanAuth")}</span>}
              {!hasTok && <button className="cp" onClick={ghSignIn}>{tt("gh.signIn")}</button>}
            </div>
          ) : scanned.length === 0 ? (
            <p className="rev-tip">{tt("st.scanNone")}</p>
          ) : (
            <>
              {scanned.filter((r) => !subs.has(r.toLowerCase())).length > 1 && (
                <div className="rev-row">
                  <button className="cp" disabled={busy} onClick={() => void submitAll()}>{tt("st.submitAll")}</button>
                </div>
              )}
              <div className="rev-list">
                {scanned.map((r) => (
                  <div key={r} className="rev-item">
                    <div className="rev-line1">
                      <b>{r}</b>
                      {subs.has(r.toLowerCase()) ? (
                        <span className="rev-tag">{tt("st.pending")}</span>
                      ) : (
                        <button className="cp" disabled={busy} onClick={() => void submitOne(r)}>{tt("st.submit")}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* 手填出路:扫描失败 / 私仓刚转公开 / code search 未及索引 */}
          <div className="rev-row">
            <input
              placeholder={tt("st.manualPh", { login })}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) void submitOne(manual.trim()); }}
              style={{ maxWidth: 320 }}
            />
            <button className="cp" disabled={busy || !manual.trim()} onClick={() => void submitOne(manual.trim())}>{tt("st.submit")}</button>
          </div>
          {scanMsg && <div className="rev-err">{scanMsg}</div>}
        </div>
      </div>
    </>
  );
}
