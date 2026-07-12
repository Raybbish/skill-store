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
        <div className="rev-form">
          <p className="rev-tip">
            {tt("talk.signedAs", { email: label })} · <button className="rev-x" onClick={() => { signOut(); setSession(null); }}>{tt("talk.signOut")}</button>
          </p>
          {studioOn && (
            <p className="rev-tip">
              <Link href="/studio/">{tt("me.studio")}</Link> — {tt("me.studioNote")}
            </p>
          )}
        </div>
      </>
    );
  }

  // 未登录:双轨登录
  return (
    <>
      {hero}
      <div className="rev-form">
        {mode === "idle" && (
          <>
            <div className="rev-row">
              <input type="email" placeholder={tt("talk.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitEmail(); }} style={{ maxWidth: 320 }} />
              <button className="cp" disabled={busy} onClick={() => void submitEmail()}>{tt("talk.sendCode")}</button>
              <button className="cp" disabled={busy} onClick={() => { window.location.href = githubAuthorizeUrl(window.location.href); }}>{tt("gh.signIn")}</button>
            </div>
            <p className="rev-tip">{tt("me.twoAccounts")}</p>
          </>
        )}
        {mode === "code" && (
          <>
            <p className="rev-tip">{tt("talk.codeTip", { email })}</p>
            <div className="rev-row">
              <input inputMode="numeric" placeholder={tt("talk.codePh")} value={code} onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitCode(); }} style={{ maxWidth: 240 }} />
              <button className="cp" disabled={busy || code.trim().length < 4} onClick={() => void submitCode()}>{tt("talk.signIn")}</button>
              <button className="rev-x" onClick={() => setMode("idle")}>{tt("talk.changeEmail")}</button>
            </div>
          </>
        )}
        {err && <div className="rev-err">{err}</div>}
      </div>
    </>
  );
}
