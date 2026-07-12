"use client";
/**
 * 「我的」客户端(一页两态):
 * - 未登录:邮箱 OTP 两步(与短评/公海同款,requestOtp 回跳本页)+「用 GitHub 登录」并列;
 *   注明邮箱与 GitHub 各是一个账号(M1 无身份链接,诚实说)。
 * - 已登录:以谁登录 + 退出;claims 开关开着时给作者工作台入口(off 时随全站口径自隐藏)。
 * env 未配 Supabase 时只说「未启用」,与其他登录场景同门禁。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  authConfigured, getSession, githubAuthorizeUrl, requestOtp, sessionFromUrlHash, signOut, verifyOtp,
  type Session,
} from "@/lib/auth";
import { claimsEnabled } from "@/lib/claims";
import { useLocale, useT } from "@/lib/i18n/client";

export default function MeClient() {
  const tt = useT();
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"idle" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [studioOn, setStudioOn] = useState(false);

  useEffect(() => {
    if (!authConfigured()) { setReady(true); return; }
    void claimsEnabled().then(setStudioOn);
    void (async () => {
      const s = (await sessionFromUrlHash()) ?? (await getSession());
      setSession(s);
      setReady(true);
    })();
  }, []);

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(tt("talk.errEmail"));
    setBusy(true); setErr("");
    try { await requestOtp(email, window.location.href, locale); setMode("code"); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function submitCode() {
    setBusy(true); setErr("");
    try { setSession(await verifyOtp(email, code)); setMode("idle"); } catch (e) { setErr((e as Error).message || tt("talk.errCode")); }
    setBusy(false);
  }

  const hero = (
    <section className="hero">
      <div className="eyebrow">{tt("me.eyebrow")}</div>
      <h1 className="small">{tt("me.title")}</h1>
    </section>
  );

  if (!authConfigured()) return <>{hero}<div className="rev-empty">{tt("me.notConfigured")}</div></>;
  if (!ready) return <>{hero}<div className="rev-empty">{tt("st.loading")}</div></>;

  // 已登录:身份 + 退出 + 作者入口(开关开着才给,入口自隐藏口径)
  if (session) {
    const label = session.user.email ?? (session.user.github_login ? `@${session.user.github_login}` : "");
    return (
      <>
        {hero}
        <div className="me-wrap">
          <div className="me-id">
            {label}
            <button className="rev-x" onClick={() => { signOut(); setSession(null); }}>{tt("talk.signOut")}</button>
          </div>
          {studioOn && (
            <Link className="me-studio" href="/studio/">
              <b>{tt("me.studio")}</b>
              <span>{tt("me.studioNote")}</span>
            </Link>
          )}
        </div>
      </>
    );
  }

  // 未登录:双轨登录(GitHub 整行 / 或 / 邮箱 OTP;并列不分主次,ADR 0023 口径)
  return (
    <>
      {hero}
      <div className="me-wrap">
        {mode === "idle" && (
          <>
            <p className="me-uses">{tt("me.uses")}</p>
            <button className="me-btn gh" disabled={busy} onClick={() => { window.location.href = githubAuthorizeUrl(window.location.href); }}>
              <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
              {tt("gh.signIn")}
            </button>
            <p className="me-note">{tt("me.ghNote")}</p>
            <div className="me-or">{tt("me.or")}</div>
            <div className="me-row">
              <input type="email" placeholder={tt("talk.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitEmail(); }} />
              <button className="me-btn" disabled={busy} onClick={() => void submitEmail()}>{tt("talk.sendCode")}</button>
            </div>
            <p className="me-note">{tt("me.twoAccounts")}</p>
          </>
        )}
        {mode === "code" && (
          <>
            <p className="me-uses">{tt("talk.codeTip", { email })}</p>
            <div className="me-row">
              <input inputMode="numeric" placeholder={tt("talk.codePh")} value={code} onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitCode(); }} />
              <button className="me-btn" disabled={busy || code.trim().length < 4} onClick={() => void submitCode()}>{tt("talk.signIn")}</button>
            </div>
            <p className="me-note"><button className="rev-x" onClick={() => setMode("idle")}>{tt("talk.changeEmail")}</button></p>
          </>
        )}
        {err && <div className="rev-err">{err}</div>}
      </div>
    </>
  );
}
