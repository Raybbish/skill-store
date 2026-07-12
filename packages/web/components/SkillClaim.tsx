"use client";
/**
 * 原作者一键认领(ADR 0006 M1 第①档):详情页作者行内联入口。
 * 流程:「是你的作品?」→ 用 GitHub 登录(回跳带 ?claim=1)→ 服务端 RPC 比对已验证 login 与 id 首段 → 即领。
 * 身份 ≠ 背书:徽章只说「作者已认领」。env 未配自隐藏。chrome 双语(ADR 0022)。
 */
import { useEffect, useState } from "react";
import { getSession, githubAuthorizeUrl, sessionFromUrlHash, type Session } from "@/lib/auth";
import { claimSkill, claimsConfigured, claimsEnabled, getClaim, type Claim } from "@/lib/claims";
import type { MsgKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

const REASON: Record<string, MsgKey> = {
  "no-github-identity": "claim.noGithub",
  "aggregator-source": "claim.aggregator",
  "already-claimed": "claim.claimed",
  "skill-not-found": "claim.notFound",
  "not-signed-in": "claim.signInFirst",
};

export default function SkillClaim({ skillId, publisher }: { skillId: string; publisher: string }) {
  const tt = useT();
  const [claim, setClaim] = useState<Claim | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [enabled, setEnabled] = useState(false); // 服务端 flag:默认下线,入口不渲染;已认领徽章不受开关影响

  useEffect(() => {
    if (!claimsConfigured()) return;
    void claimsEnabled().then(setEnabled);
    void getClaim(skillId).then(setClaim);
    // GitHub 登录回跳(?claim=1):接住会话直接续认领,用户无感
    if (new URLSearchParams(window.location.search).has("claim")) {
      setOpen(true);
      void (async () => {
        const s = (await sessionFromUrlHash()) ?? (await getSession());
        const url = new URL(window.location.href);
        url.searchParams.delete("claim");
        history.replaceState(null, "", url.pathname + url.search);
        if (s) await doClaim(s);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  async function doClaim(s: Session) {
    setBusy(true); setMsg("");
    const r = await claimSkill(s, skillId);
    setBusy(false);
    if (r.ok) {
      setClaim(await getClaim(skillId));
      setOpen(false);
      return;
    }
    if (r.reason.startsWith("owner-mismatch:")) {
      setMsg(tt("claim.mismatch", { got: r.reason.split(":")[1], want: publisher }));
    } else {
      const k = REASON[r.reason];
      setMsg(k ? tt(k) : tt("claim.fail", { s: r.reason }));
    }
  }

  async function start() {
    setMsg("");
    const s = await getSession();
    if (s) { await doClaim(s); return; } // 已登录(可能就是 GitHub 登录)→ 直接试;无 GitHub 身份会被服务端打回并提示
    const url = new URL(window.location.href);
    url.searchParams.set("claim", "1");
    window.location.href = githubAuthorizeUrl(url.toString());
  }

  if (!claimsConfigured()) return null;

  if (claim) {
    // 已认领徽章不受开关影响:归属是既成事实,下线入口不抹历史
    return (
      <span className="d-tag claim-tag" title={tt("claim.doneTip", { login: claim.github_login, d: claim.created_at.slice(0, 10) })}>
        {tt("claim.done")}
      </span>
    );
  }

  if (!enabled) return null; // 功能未上线:入口不渲染(服务端 RPC 同步拒绝,双层一致)

  return (
    <span className="claim-wrap">
      <button className="claim-link" onClick={() => setOpen((v) => !v)}>{tt("claim.q")}</button>
      {open && (
        <span className="claim-pane">
          {busy ? (
            <span className="claim-msg">{tt("claim.busy")}</span>
          ) : (
            <>
              <button className="cp" onClick={() => void start()}>{tt("claim.btn")}</button>
              {/* 工作台入口(ADR 0023):批量认领 + 提交未收录;开关同 claims flag,面板不渲染时入口自然消失 */}
              <a className="claim-link" href="/studio/">{tt("claim.all")}</a>
              {msg && <span className="claim-msg">{msg}</span>}
            </>
          )}
        </span>
      )}
    </span>
  );
}
