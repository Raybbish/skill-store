"use client";
/**
 * 统一登录组件(精修版 2026-07-16):GitHub 深色实心 + 「或」+ 邮箱 6 位分段验证码。
 * 保持 onSession/onCancel 契约不变——/login 页与短评/工作台内联复用同一组件,精修一并生效。
 * 分段码:自动跳格 / 退格回退 / 粘贴自动分配;60s 倒计时重发;发送中·验证中·跳转中均有反馈。
 * OAuth 与魔法链接都回跳当前页,由挂载方(LoginClient / SkillReviews)的 sessionFromUrlHash 接住。
 */
import { useEffect, useRef, useState } from "react";
import { githubAuthorizeUrl, requestOtp, verifyOtp, type Session } from "@/lib/auth";
import { useLocale, useT } from "@/lib/i18n/client";

/** 邮件验证码位数,与后端 GoTrue 模板一致(6);改这里前先确认后端码长 */
const OTP_LEN = 6;

export default function SignInBox({ onSession, onCancel }: { onSession: (s: Session) => void; onCancel?: () => void }) {
  const tt = useT();
  const locale = useLocale();
  const [mode, setMode] = useState<"idle" | "code">("idle");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LEN).fill(""));
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [gh, setGh] = useState(false);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(0);
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setInterval(() => setLeft((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => window.clearInterval(id);
  }, [left]);

  function toCode() {
    setDigits(Array(OTP_LEN).fill(""));
    setMode("code");
    setLeft(60);
    window.setTimeout(() => boxRefs.current[0]?.focus(), 30);
  }

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr(tt("talk.errEmail")); return; }
    setBusy(true); setErr("");
    try { await requestOtp(email, window.location.href, locale); toCode(); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function resend() {
    if (left > 0) return;
    setErr("");
    try { await requestOtp(email, window.location.href, locale); setLeft(60); }
    catch (e) { setErr((e as Error).message); }
  }

  async function submitCode() {
    if (code.length < OTP_LEN) return;
    setVerifying(true); setErr("");
    try { onSession(await verifyOtp(email, code)); }
    catch (e) { setErr((e as Error).message || tt("talk.errCode")); setVerifying(false); }
  }

  function setDigit(i: number, raw: string) {
    const c = raw.replace(/\D/g, "");
    setDigits((d) => {
      const n = [...d];
      if (!c) { n[i] = ""; return n; }
      const cs = c.split("");
      for (let k = 0; k < cs.length && i + k < OTP_LEN; k++) n[i + k] = cs[k];
      return n;
    });
    if (c) boxRefs.current[Math.min(i + c.length, OTP_LEN - 1)]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) boxRefs.current[i - 1]?.focus();
    else if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitCode();
  }

  return (
    <div className="me-wrap">
      {mode === "idle" && (
        <>
          <button className="me-btn gh" disabled={gh} onClick={() => { setGh(true); window.location.href = githubAuthorizeUrl(window.location.href); }}>
            {gh ? <span className="me-spin light" aria-hidden="true" /> : (
              <svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            )}
            {tt("gh.signIn")}
          </button>
          <p className="me-note">{tt("me.ghNote")}</p>
          <div className="me-or">{tt("me.or")}</div>
          <div className="me-row">
            <input type="email" autoComplete="email" placeholder={tt("talk.emailPh")} value={email} disabled={busy}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitEmail(); }} />
            <button className="me-btn" disabled={busy} onClick={() => void submitEmail()}>
              {busy ? <span className="me-spin" aria-hidden="true" /> : tt("talk.sendCode")}
            </button>
          </div>
          <p className="me-note">
            {tt("me.twoAccounts")}
            {onCancel && <> · <button className="rev-x" onClick={onCancel}>{tt("talk.cancel")}</button></>}
          </p>
        </>
      )}
      {mode === "code" && (
        <>
          <p className="me-uses">{tt("login.codeSent", { email })} <button className="rev-x" onClick={() => { setMode("idle"); setErr(""); }}>{tt("talk.changeEmail")}</button></p>
          <div className="me-otp" role="group" aria-label={tt("login.title")}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { boxRefs.current[i] = el; }} inputMode="numeric" maxLength={OTP_LEN}
                aria-label={tt("login.codeDigit", { i: i + 1 })} value={d} disabled={verifying}
                onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} />
            ))}
          </div>
          <button className="me-btn me-primary" disabled={verifying || code.length < OTP_LEN} onClick={() => void submitCode()}>
            {verifying ? <span className="me-spin light" aria-hidden="true" /> : tt("talk.signIn")}
          </button>
          <p className="me-note">
            {left > 0 ? tt("login.resendIn", { s: left }) : <button className="me-link" onClick={() => void resend()}>{tt("login.resend")}</button>}
          </p>
        </>
      )}
      {err && <div className="rev-err">{err}</div>}
    </div>
  );
}
