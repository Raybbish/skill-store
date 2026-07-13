"use client";
/**
 * 统一登录组件(用户裁决 2026-07-13:全站登录界面统一为 /me 同款,原地展开不跳页):
 * GitHub 整行按钮 + 「或」分隔 + 邮箱 OTP 两步。样式复用 me-*(globals.css)。
 * 延迟注册不破:挂在动作原地(短评/工作台/我的),登录完成即回调 onSession,人不离开页面;
 * OAuth 与魔法链接都回跳当前页,由挂载方的 sessionFromUrlHash 统一接住。
 */
import { useState } from "react";
import { githubAuthorizeUrl, requestOtp, verifyOtp, type Session } from "@/lib/auth";
import { useLocale, useT } from "@/lib/i18n/client";

export default function SignInBox({ onSession, onCancel }: { onSession: (s: Session) => void; onCancel?: () => void }) {
  const tt = useT();
  const locale = useLocale();
  const [mode, setMode] = useState<"idle" | "code">("idle");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(tt("talk.errEmail"));
    setBusy(true); setErr("");
    try { await requestOtp(email, window.location.href, locale); setMode("code"); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function submitCode() {
    setBusy(true); setErr("");
    try { onSession(await verifyOtp(email, code)); } catch (e) { setErr((e as Error).message || tt("talk.errCode")); }
    setBusy(false);
  }

  return (
    <div className="me-wrap">
      {mode === "idle" && (
        <>
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
          <p className="me-note">
            {tt("me.twoAccounts")}
            {onCancel && <> · <button className="rev-x" onClick={onCancel}>{tt("talk.cancel")}</button></>}
          </p>
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
  );
}
