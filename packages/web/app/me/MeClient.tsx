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
import { authConfigured, getSession, sessionFromUrlHash, signOut, type Session } from "@/lib/auth";
import { claimsEnabled } from "@/lib/claims";
import SignInBox from "@/components/SignInBox";
import { useT } from "@/lib/i18n/client";

export default function MeClient() {
  const tt = useT();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
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

  // 未登录:统一登录组件(SignInBox,与短评区同款;并列不分主次,ADR 0023 口径)
  return (
    <>
      {hero}
      <p className="me-uses" style={{ maxWidth: 440, marginBottom: 14 }}>{tt("me.uses")}</p>
      <SignInBox onSession={setSession} />
    </>
  );
}
