"use client";
/**
 * 原作者一键认领(ADR 0006 M1 第①档):详情页作者行内联入口。
 * 流程:「是你的作品?」→ 用 GitHub 登录(回跳带 ?claim=1)→ 服务端 RPC 比对已验证 login 与 id 首段 → 即领。
 * 身份 ≠ 背书:徽章只说「作者已认领」。env 未配自隐藏。
 */
import { useEffect, useState } from "react";
import { getSession, githubAuthorizeUrl, sessionFromUrlHash, type Session } from "@/lib/auth";
import { claimSkill, claimsConfigured, claimsEnabled, getClaim, type Claim } from "@/lib/claims";

const REASON: Record<string, string> = {
  "no-github-identity": "当前登录方式不含 GitHub——认领需要用 GitHub 登录(证明你控制这个仓)",
  "aggregator-source": "这条来自多作者合集仓,自动认领不适用;其他验证方式在路上",
  "already-claimed": "这条已被认领;如有争议请联系我们仲裁",
  "skill-not-found": "没找到这条 skill(可能刚下架)",
  "not-signed-in": "请先登录",
};

export default function SkillClaim({ skillId, publisher }: { skillId: string; publisher: string }) {
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
      setMsg(`你的 GitHub(@${r.reason.split(":")[1]})与 @${publisher} 不一致——换对应账号登录后再试`);
    } else {
      setMsg(REASON[r.reason] ?? `没成功(${r.reason})`);
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
      <span className="d-tag claim-tag" title={`@${claim.github_login} 于 ${claim.created_at.slice(0, 10)} 认领;身份说明,非平台背书`}>
        ✓ 作者已认领
      </span>
    );
  }

  if (!enabled) return null; // 功能未上线:入口不渲染(服务端 RPC 同步拒绝,双层一致)

  return (
    <span className="claim-wrap">
      <button className="claim-link" onClick={() => setOpen((v) => !v)}>是你的作品?</button>
      {open && (
        <span className="claim-pane">
          {busy ? (
            <span className="claim-msg">认领中…</span>
          ) : (
            <>
              <button className="cp" onClick={() => void start()}>用 GitHub 认领</button>
              {msg && <span className="claim-msg">{msg}</span>}
            </>
          )}
        </span>
      )}
    </span>
  );
}
