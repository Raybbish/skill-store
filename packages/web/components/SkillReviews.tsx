"use client";
/**
 * 评论区(ADR 0026,就地改造自「短评」砖二):
 * 一人一 skill 可发多条 · 一层回复 · 顶/踩(一人一票可反悔)。好/一般/不好用降级为主楼「可选档位」。
 * 门槛(用户裁决 2026-07-14):发言只需登录(邮箱 OTP / GitHub);验证不再是门,「已验证安装」转生为徽章
 * ——发布者名下确有本店回执时由服务端盖章,不可伪造(见 2026-07-14-verified-stamp-by-author.sql)。
 * 未配置 Supabase env → 整块隐藏,货架与今天一致。双语(ADR 0022):chrome 词典化,用户内容保持原文。
 *
 * 实现注:Item / VoteBar / composeForm 写成「返回 JSX 的函数」而非内嵌组件——内嵌组件每次渲染是新类型,
 * 会把内联回复框整棵重挂、输入丢焦点。函数调用只产出稳定的原生元素树,无此坑。
 */
import { useEffect, useMemo, useState } from "react";
import { claimReceipts, getSession, sessionFromUrlHash, signOut, type Session } from "@/lib/auth";
import SignInBox from "@/components/SignInBox";
import {
  castVote, clearVote, deleteComment, listMyVotes, listReviews, postComment,
  reviewsConfigured, type Review, type Verdict,
} from "@/lib/reviews";
import { relTime, type MsgKey } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const V: Record<Verdict, { k: MsgKey; cls: string }> = {
  good: { k: "rev.good", cls: "rv-good" },
  ok: { k: "rev.ok", cls: "rv-ok" },
  bad: { k: "rev.bad", cls: "rv-bad" },
};

/** 打开的写作框:null=关;"top"=写主楼;数字=回复该主楼 id */
type ComposeTarget = number | "top" | null;

export default function SkillReviews({ skillId, contentHash, scene }: { skillId: string; contentHash?: string; scene: string[] }) {
  const tt = useT();
  const locale = useLocale();
  /** lib 层抛的 E:键值 → 按 locale 翻译;非键值原样透出 */
  const errText = (e: unknown): string => {
    const m = (e as Error).message ?? "";
    if (!m.startsWith("E:")) return m;
    const [, key, s] = m.split(":");
    return tt(key as MsgKey, s ? { s } : undefined);
  };

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [myVotes, setMyVotes] = useState<Record<number, 1 | -1>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [signin, setSignin] = useState(false);
  const [afterSignin, setAfterSignin] = useState<ComposeTarget>(null); // 登录成功后要打开的写作框(投票触发登录时为 null)
  const [composeAt, setComposeAt] = useState<ComposeTarget>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // 写作框内容(同一时刻只有一个框打开,状态共享)
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [text, setText] = useState("");
  const [nick, setNick] = useState("");
  const [selScenes, setSelScenes] = useState<string[]>([]);

  useEffect(() => {
    if (!reviewsConfigured()) return;
    try { setNick(localStorage.getItem("oms_nick") ?? ""); } catch { /* 忽略 */ }
    // 评论匿名可读,先取列表;会话并行解析,回来再补「我的票」。
    void listReviews(skillId).then((list) => {
      setReviews(list);
      void resolveSession().then((s) => {
        setSession(s);
        if (s && list.length) void listMyVotes(s, list.map((r) => r.id)).then(setMyVotes);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  /** 接魔法链接回跳(hash 令牌)→ 视为「用户正要发言」直接开主楼写作框;?claim=1 只收会话不抢框(交给 SkillClaim) */
  async function resolveSession(): Promise<Session | null> {
    const isClaimReturn = new URLSearchParams(window.location.search).has("claim");
    const fromLink = await sessionFromUrlHash();
    if (fromLink) {
      if (!isClaimReturn) { void claimReceipts(fromLink); setComposeAt("top"); }
      return fromLink;
    }
    return getSession();
  }

  if (!reviewsConfigured()) return null;

  async function refresh(sess: Session | null) {
    const list = await listReviews(skillId);
    setReviews(list);
    if (sess && list.length) setMyVotes(await listMyVotes(sess, list.map((r) => r.id)));
    else setMyVotes({});
  }

  function resetCompose() { setVerdict(null); setText(""); setSelScenes([]); }

  function openCompose(target: ComposeTarget) {
    setErr("");
    if (!session) { setAfterSignin(target); setSignin(true); return; }
    resetCompose();
    setComposeAt(target);
  }

  function onSignedIn(s: Session) {
    setSignin(false);
    setSession(s);
    void claimReceipts(s);
    if (reviews?.length) void listMyVotes(s, reviews.map((r) => r.id)).then(setMyVotes);
    if (afterSignin !== null) { resetCompose(); setComposeAt(afterSignin); }
    setAfterSignin(null);
  }

  async function submit(isReply: boolean) {
    if (!session) return;
    if (isReply ? !text.trim() : !verdict && !text.trim()) {
      return setErr(tt(isReply ? "rev.textReq" : "rev.emptyTop"));
    }
    setBusy(true); setErr("");
    try {
      await postComment(session, {
        skill_id: skillId,
        reply_to: isReply ? (composeAt as number) : null,
        verdict: isReply ? null : verdict,
        text,
        scene_tags: isReply ? [] : selScenes,
        author_label: nick,
        content_hash: isReply ? null : contentHash ?? null, // 主楼记「评于货架版本」,内容更新后显示「评于旧版本」
      });
      try { if (nick.trim()) localStorage.setItem("oms_nick", nick.trim()); } catch { /* 忽略 */ }
      setComposeAt(null); resetCompose();
      await refresh(session);
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  }

  /** 顶/踩:未登录先登录;已登录乐观更新计数与「我的票」,失败回滚重取。再点同一档 = 取消。 */
  async function vote(r: Review, v: 1 | -1) {
    if (!session) { setAfterSignin(null); setSignin(true); return; }
    const cur = (myVotes[r.id] ?? 0) as 0 | 1 | -1;
    const next = (cur === v ? 0 : v) as 0 | 1 | -1;
    setReviews((rs) => rs?.map((x) => x.id !== r.id ? x : {
      ...x,
      up: x.up + (next === 1 ? 1 : 0) - (cur === 1 ? 1 : 0),
      down: x.down + (next === -1 ? 1 : 0) - (cur === -1 ? 1 : 0),
    }) ?? rs);
    setMyVotes((m) => { const n = { ...m }; if (next === 0) delete n[r.id]; else n[r.id] = next; return n; });
    try {
      if (next === 0) await clearVote(session, r.id);
      else await castVote(session, r.id, next);
    } catch (e) { setErr(errText(e)); void refresh(session); }
  }

  async function del(r: Review) {
    if (!session || !window.confirm(tt("rev.confirmDel"))) return;
    setBusy(true); setErr("");
    try { await deleteComment(session, r.id); await refresh(session); }
    catch (e) { setErr(errText(e)); }
    setBusy(false);
  }

  // 树:主楼按时间倒序(新在前),回复按时间正序挂在主楼下
  const tops = useMemo(
    () => (reviews ?? []).filter((r) => r.reply_to == null).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [reviews],
  );
  const repliesOf = useMemo(() => {
    const m: Record<number, Review[]> = {};
    for (const r of reviews ?? []) if (r.reply_to != null) (m[r.reply_to] ??= []).push(r);
    for (const k of Object.keys(m)) m[Number(k)].sort((a, b) => a.created_at.localeCompare(b.created_at));
    return m;
  }, [reviews]);

  function voteBar(r: Review) {
    const mine = myVotes[r.id];
    return (
      <span className="rev-votes">
        <button className={`rev-vote up ${mine === 1 ? "on" : ""}`} disabled={busy} onClick={() => void vote(r, 1)} title={tt("rev.upTip")} aria-label={tt("rev.upTip")}>
          ▲{r.up > 0 ? ` ${r.up}` : ""}
        </button>
        <button className={`rev-vote down ${mine === -1 ? "on" : ""}`} disabled={busy} onClick={() => void vote(r, -1)} title={tt("rev.downTip")} aria-label={tt("rev.downTip")}>
          ▼{r.down > 0 ? ` ${r.down}` : ""}
        </button>
      </span>
    );
  }

  function item(r: Review, isReply: boolean) {
    const mine = session?.user.id === r.user_id;
    return (
      <div key={r.id} className={isReply ? "rev-item rev-reply" : "rev-item"}>
        <div className="rev-line1">
          {r.verdict && <span className={`rv-badge ${V[r.verdict].cls}`}>{tt(V[r.verdict].k)}</span>}
          <b>{r.author_label || tt("talk.user")}</b>
          {r.verified && <span className="rev-tag" title={tt("rev.verifiedTip")}>{tt("rev.verified")}</span>}
          {r.content_hash && contentHash && r.content_hash !== contentHash && (
            <span className="rev-tag old" title={tt("rev.oldVerTip")}>{tt("rev.oldVer")}</span>
          )}
          <span className="rev-when">{relTime(locale, r.created_at)?.rel}</span>
        </div>
        {r.text && <p className="rev-text">{r.text}</p>}
        {!isReply && r.scene_tags && r.scene_tags.length > 0 && (
          <div className="rev-scenes-ro">{r.scene_tags.map((w) => <span key={w} className="sc">{w}</span>)}</div>
        )}
        <div className="rev-actions">
          {voteBar(r)}
          {!isReply && <button className="rev-act" onClick={() => openCompose(r.id)}>{tt("rev.reply")}</button>}
          {mine && <button className="rev-act" onClick={() => void del(r)}>{tt("rev.delete")}</button>}
        </div>
        {composeAt === r.id && <div className="rev-inline">{composeForm(true)}</div>}
        {!isReply && repliesOf[r.id]?.map((c) => item(c, true))}
      </div>
    );
  }

  function composeForm(isReply: boolean) {
    return (
      <div className="rev-form">
        {!isReply && (
          <div className="rev-row">
            {(Object.keys(V) as Verdict[]).map((k) => (
              <button key={k} className={`rv-pick ${V[k].cls} ${verdict === k ? "on" : ""}`} onClick={() => setVerdict(verdict === k ? null : k)}>{tt(V[k].k)}</button>
            ))}
            <span className="rev-optional">{tt("rev.verdictOpt")}</span>
          </div>
        )}
        <textarea maxLength={500} placeholder={isReply ? tt("rev.replyPh") : tt("rev.textPh")} value={text} onChange={(e) => setText(e.target.value)} />
        {!isReply && scene.length > 0 && (
          <div className="rev-row rev-scenes">
            {scene.slice(0, 8).map((w) => (
              <button key={w} className={`sc ${selScenes.includes(w) ? "on" : ""}`}
                onClick={() => setSelScenes((p) => (p.includes(w) ? p.filter((x) => x !== w) : p.length < 5 ? [...p, w] : p))}>
                {w}
              </button>
            ))}
          </div>
        )}
        <div className="rev-row">
          <input placeholder={tt("rev.nickPh")} maxLength={24} value={nick} onChange={(e) => setNick(e.target.value)} style={{ maxWidth: 200 }} />
          <button className="cp" disabled={busy} onClick={() => void submit(isReply)}>{tt("rev.send")}</button>
          <button className="rev-x" onClick={() => { setComposeAt(null); setErr(""); }}>{tt("talk.cancel")}</button>
        </div>
        {session && (
          <div className="rev-meta">
            {tt("talk.signedAs", { email: session.user.email ?? (session.user.github_login ? `@${session.user.github_login}` : "") })}
            {" · "}
            <button className="rev-x" onClick={() => { signOut(); setSession(null); setMyVotes({}); setComposeAt(null); }}>{tt("talk.signOut")}</button>
          </div>
        )}
        {err && <div className="rev-err">{err}</div>}
      </div>
    );
  }

  return (
    <section className="rev">
      <div className="rev-h">
        <h2>{tt("rev.title")}{reviews?.length ? ` · ${reviews.length}` : ""}</h2>
        {composeAt !== "top" && !signin && (
          <button className="cp" disabled={busy} onClick={() => openCompose("top")}>{tt("rev.write")}</button>
        )}
      </div>
      <div className="rev-gate">{tt("rev.gateOff")}</div>

      {signin && (
        <div className="rev-form">
          <SignInBox onSession={onSignedIn} onCancel={() => { setSignin(false); setAfterSignin(null); }} />
        </div>
      )}

      {composeAt === "top" && composeForm(false)}
      {err && composeAt === null && !signin && <div className="rev-err">{err}</div>}

      {reviews === null ? (
        <div className="rev-empty">…</div>
      ) : reviews.length === 0 ? (
        <div className="rev-empty">{tt("rev.empty")}</div>
      ) : (
        <div className="rev-list">
          {tops.map((r) => item(r, false))}
        </div>
      )}
    </section>
  );
}
