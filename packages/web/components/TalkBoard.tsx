"use client";
/**
 * 公海讨论区(ADR 0021,呈现 = 设计方案 C「信笺流」):正文即版面——16.5px 大字当主角,
 * 署名/时间沉底成注脚,官方帖左侧蓝线(服务端置位,不可自标)。楼 + 一层回复,>3 条折叠。
 * 登录复用短评的 OTP 内联两步(延迟注册:点「发布」才要验证码,草稿不丢);列表匿名可读。
 * 双语(ADR 0022):/talk = zh、/en/talk/ = en,词典经 useT;用户内容保持原文。
 */
import { useEffect, useState } from "react";
import { getSession, requestOtp, sessionFromUrlHash, signOut, verifyOtp, type Session } from "@/lib/auth";
import { deletePost, listThreads, postMessage, talkConfigured, type Post } from "@/lib/talk";
import { relTime } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

/** 默认露出的回复条数;更多折叠成「展开全部 N 条」(显示最新的,展开后完整对话序) */
const REPLY_FOLD = 3;

export default function TalkBoard() {
  const tt = useT();
  const locale = useLocale();
  /** lib 层抛的 E:键值 → 按 locale 翻译;非键值原样透出 */
  const errText = (e: unknown): string => {
    const m = (e as Error).message ?? "";
    if (!m.startsWith("E:")) return m;
    const [, key, s] = m.split(":");
    return tt(key as Parameters<typeof tt>[0], s ? { s } : undefined);
  };
  const [tops, setTops] = useState<Post[] | null>(null);
  const [replies, setReplies] = useState<Map<number, Post[]>>(new Map());
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"idle" | "email" | "code">("idle");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nick, setNick] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null); // 打开中的回复框(一次一个)
  const [replyDraft, setReplyDraft] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // 已展开全部回复的楼

  async function refresh() {
    const t = await listThreads();
    setTops(t.tops);
    setReplies(t.replies);
  }

  useEffect(() => {
    if (!talkConfigured()) return;
    void refresh();
    try { setNick(localStorage.getItem("oms_nick") ?? ""); } catch { /* 忽略 */ }
    // 魔法链接回跳(hash 令牌)优先接住;否则取既有会话
    void sessionFromUrlHash().then((fromLink) => {
      if (fromLink) setSession(fromLink);
      else void getSession().then(setSession);
    });
  }, []);

  if (!talkConfigured()) return <div className="rev-empty">{tt("talk.notConfigured")}</div>;

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(tt("talk.errEmail"));
    setBusy(true); setErr("");
    try { await requestOtp(email, window.location.href); setMode("code"); } catch (e) { setErr(errText(e)); }
    setBusy(false);
  }

  async function submitCode() {
    setBusy(true); setErr("");
    try {
      const s = await verifyOtp(email, code);
      setSession(s);
      setMode("idle");
    } catch (e) { setErr((e as Error).message || tt("talk.errCode")); }
    setBusy(false);
  }

  async function send(body: string, to?: number) {
    if (!session) return setMode("email"); // 草稿留在框里,登录完再点一次发布
    if (!body.trim()) return setErr(tt("talk.errEmpty"));
    setBusy(true); setErr("");
    try {
      await postMessage(session, body, to, nick);
      try { if (nick.trim()) localStorage.setItem("oms_nick", nick.trim()); } catch { /* 忽略 */ }
      if (to) { setReplyDraft(""); setReplyTo(null); } else setDraft("");
      await refresh();
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  }

  /** 待确认删除的帖 id:行内二次确认,不用 window.confirm(样式不可控且与站点语言断裂) */
  const [confirmDel, setConfirmDel] = useState<Post["id"] | null>(null);

  async function remove(p: Post) {
    if (!session) return;
    setBusy(true); setErr("");
    try { await deletePost(session, p.id); await refresh(); } catch (e) { setErr(errText(e)); }
    setBusy(false); setConfirmDel(null);
  }

  /** 注脚行:署名 · 官方签 · 相对时间(悬停精确日)· 回复/删除(删除 = 行内二次确认) */
  const foot = (p: Post, withReply: boolean) => {
    const n = p.reply_to == null ? (replies.get(p.id)?.length ?? 0) : 0;
    return (
    <div className="tk-foot">
      <span className="tk-nick">{p.author_label || tt("talk.user")}</span>
      {p.official && <span className="tk-official" title={tt("talk.officialTip")}>{tt("talk.official")}</span>}
      <span className="tk-when" title={p.created_at.slice(0, 10)}>{relTime(locale, p.created_at)?.rel}</span>
      {withReply && (
        <button className="tk-act" onClick={() => { setReplyTo(replyTo === p.id ? null : p.id); setReplyDraft(""); }}>{tt("talk.reply")}</button>
      )}
      {session?.user.id === p.user_id && (confirmDel === p.id ? (
        <span className="tk-confirm">
          {n ? tt("talk.confirmDelN", { n }) : tt("talk.confirmDel")}
          <button className="tk-act tk-danger" disabled={busy} onClick={() => void remove(p)}>{tt("talk.confirmYes")}</button>
          <button className="tk-act" onClick={() => setConfirmDel(null)}>{tt("talk.cancel")}</button>
        </span>
      ) : (
        <button className="tk-act" disabled={busy} onClick={() => setConfirmDel(p.id)}>{tt("talk.delete")}</button>
      ))}
    </div>
    );
  };

  return (
    <section className="tk">
      {/* 发帖框:未登录点「发布」进 OTP 两步,草稿不丢 */}
      <div className="tk-composer">
        <textarea
          maxLength={2000}
          placeholder={tt("talk.placeholder")}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="tk-row">
          <input placeholder={tt("talk.nick")} maxLength={24} value={nick} onChange={(e) => setNick(e.target.value)} />
          <button className="cp" disabled={busy} onClick={() => void send(draft)}>{tt("talk.post")}</button>
          {session ? (
            <span className="tk-when">
              {tt("talk.signedAs", { email: session.user.email ?? "" })} · <button className="tk-act" onClick={() => { signOut(); setSession(null); }}>{tt("talk.signOut")}</button>
            </span>
          ) : (
            <span className="tk-when">{tt("talk.signHint")}</span>
          )}
        </div>
      </div>

      {mode === "email" && (
        <div className="rev-form">
          <div className="rev-row">
            <input type="email" placeholder={tt("talk.emailPh")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="cp" disabled={busy} onClick={() => void submitEmail()}>{tt("talk.sendCode")}</button>
            <button className="rev-x" onClick={() => setMode("idle")}>{tt("talk.cancel")}</button>
          </div>
        </div>
      )}
      {mode === "code" && (
        <div className="rev-form">
          <p className="rev-tip">{tt("talk.codeTip", { email })}</p>
          <div className="rev-row">
            <input inputMode="numeric" placeholder={tt("talk.codePh")} value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="cp" disabled={busy || code.trim().length < 4} onClick={() => void submitCode()}>{tt("talk.signIn")}</button>
            <button className="rev-x" onClick={() => setMode("email")}>{tt("talk.changeEmail")}</button>
          </div>
        </div>
      )}
      {err && <div className="rev-err">{err}</div>}

      {tops === null ? (
        <div className="rev-empty">…</div>
      ) : tops.length === 0 ? (
        <div className="rev-empty">{tt("talk.empty")}</div>
      ) : (
        <div>
          {tops.map((tp) => {
            const all = replies.get(tp.id) ?? [];
            const folded = !expanded.has(tp.id) && all.length > REPLY_FOLD;
            const shown = folded ? all.slice(-REPLY_FOLD) : all;
            const inner = (
              <>
                <div className="tk-body">{tp.body}</div>
                {foot(tp, true)}
                {folded && (
                  <div className="tk-reply">
                    <button className="tk-act" onClick={() => setExpanded((prev) => new Set(prev).add(tp.id))}>
                      {tt("talk.expand", { n: all.length })}
                    </button>
                  </div>
                )}
                {shown.map((r) => (
                  <div key={r.id} className="tk-reply">
                    <div className="tk-body">{r.body}</div>
                    {foot(r, false)}
                  </div>
                ))}
                {replyTo === tp.id && (
                  <div className="tk-row" style={{ marginTop: 12 }}>
                    <input
                      style={{ flex: 1, maxWidth: 420 }}
                      placeholder={tt("talk.replyPh")}
                      maxLength={2000}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void send(replyDraft, tp.id); }}
                    />
                    <button className="cp" disabled={busy} onClick={() => void send(replyDraft, tp.id)}>{tt("talk.reply")}</button>
                    <button className="tk-act" onClick={() => { setReplyTo(null); setReplyDraft(""); }}>{tt("talk.cancel")}</button>
                  </div>
                )}
              </>
            );
            return (
              <div key={tp.id} className="tk-item">
                {tp.official ? <div className="tk-off">{inner}</div> : inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
