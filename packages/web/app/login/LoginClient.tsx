"use client";
/**
 * 登录页客户端(ADR 0023 追记三,2026-07-16;同日用户裁决改单栏方向 A):
 * 窄栏(400px)水平垂直双居中,品牌缩成表单头上一行小标,挂统一 SignInBox。
 * 已登录访问 /login → 直接回 /me;登录成功 → 回 /me。未配置后端时同 /me 门禁,只说「未启用」。
 * OAuth/魔法链接回跳落本页,sessionFromUrlHash 接住(与 /me、短评区同一条回收管道)。
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authConfigured, getSession, sessionFromUrlHash } from "@/lib/auth";
import SignInBox from "@/components/SignInBox";
import { useT } from "@/lib/i18n/client";

export default function LoginClient() {
  const tt = useT();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authConfigured()) { setReady(true); return; }
    void (async () => {
      const s = (await sessionFromUrlHash()) ?? (await getSession());
      if (s) { router.replace("/me/"); return; }
      setReady(true);
    })();
  }, [router]);

  if (!authConfigured()) {
    return (
      <>
        <section className="hero"><h1 className="small">{tt("login.title")}</h1></section>
        <div className="rev-empty">{tt("me.notConfigured")}</div>
      </>
    );
  }
  if (!ready) return <div className="rev-empty">{tt("st.loading")}</div>;

  return (
    <div className="lg-solo">
      <div className="lg-form">
        <div className="lg-mark"><span className="lg-mk">◆</span><span className="lg-wm">oh-my<em>-skill</em></span></div>
        <h1 className="lg-title">{tt("login.title")}</h1>
        <p className="lg-sub">{tt("login.sub")}</p>
        <SignInBox onSession={() => router.replace("/me/")} />
      </div>
    </div>
  );
}
