"use client";
/**
 * 公海讨论区(ADR 0021,呈现 = 设计方案 C「信笺流」):正文即版面——16.5px 大字当主角,
 * 署名/时间沉底成注脚,官方帖左侧蓝线(服务端置位,不可自标)。楼 + 一层回复,>3 条折叠。
 * 登录复用短评的 OTP 内联两步(延迟注册:点「发布」才要验证码,草稿不丢);列表匿名可读。
 * 未配置 env → 显示「未启用」一行。数据接口见 lib/talk.ts;样式 tk-* 族(globals.css)。
 */
import { useEffect, useState } from "react";
import { getSession, requestOtp, sessionFromUrlHash, signOut, verifyOtp, type Session } from "@/lib/auth";
import { deletePost, listThreads, postMessage, talkConfigured, type Post } from "@/lib/talk";

function rel(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return days <= 0 ? "今天" : days < 7 ? `${days} 天前` : days < 30 ? `${Math.floor(days / 7)} 周前`
    : days < 365 ? `${Math.floor(days / 30)} 个月前` : `${Math.floor(days / 365)} 年前`;
}

/** 默认露出的回复条数;更多折叠成「展开全部 N 条」(显示最新的,展开后完整对话序) */
const REPLY_FOLD = 3;

export default function TalkBoard() {
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

  if (!talkConfigured()) return <div className="rev-empty">讨论区未启用(后端未配置)。</div>;

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("邮箱格式不对");
    setBusy(true); setErr("");
    try { await requestOtp(email, window.location.href); setMode("code"); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function submitCode() {
    setBusy(true); setErr("");
    try {
      const s = await verifyOtp(email, code);
      setSession(s);
      setMode("idle");
    } catch (e) { setErr((e as Error).message || "验证码不对或已过期"); }
    setBusy(false);
  }

  async function send(body: string, to?: number) {
    if (!session) return setMode("email"); // 草稿留在框里,登录完再点一次发布
    if (!body.trim()) return setErr("写点内容再发");
    setBusy(true); setErr("");
    try {
      await postMessage(session, body, to, nick);
      try { if (nick.trim()) localStorage.setItem("oms_nick", nick.trim()); } catch { /* 忽略 */ }
      if (to) { setReplyDraft(""); setReplyTo(null); } else setDraft("");
      await refresh();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function remove(p: Post) {
    if (!session) return;
    const n = p.reply_to == null ? (replies.get(p.id)?.length ?? 0) : 0;
    if (!window.confirm(n ? `删除这条会连带删掉 ${n} 条回复,确定?` : "删除这条?")) return;
    setBusy(true); setErr("");
    try { await deletePost(session, p.id); await refresh(); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  /** 注脚行:署名 · 官方签 · 相对时间(悬停精确日)· 回复/删除 */
  const foot = (p: Post, withReply: boolean) => (
    <div className="tk-foot">
      <span className="tk-nick">{p.author_label || "用户"}</span>
      {p.official && <span className="tk-official" title="商店官方帖(服务端标记,不可自标)">官方</span>}
      <span className="tk-when" title={p.created_at.slice(0, 10)}>{rel(p.created_at)}</span>
      {withReply && (
        <button className="tk-act" onClick={() => { setReplyTo(replyTo === p.id ? null : p.id); setReplyDraft(""); }}>回复</button>
      )}
      {session?.user.id === p.user_id && (
        <button className="tk-act" disabled={busy} onClick={() => void remove(p)}>删除</button>
      )}
    </div>
  );

  return (
    <section className="tk">
      {/* 发帖框:未登录点「发布」进 OTP 两步,草稿不丢 */}
      <div className="tk-composer">
        <textarea
          maxLength={2000}
          placeholder="求推荐、提问、反馈,或任何想说的——纯文本"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="tk-row">
          <input placeholder="署名(可选,默认「用户」)" maxLength={24} value={nick} onChange={(e) => setNick(e.target.value)} />
          <button className="cp" disabled={busy} onClick={() => void send(draft)}>发布</button>
          {session ? (
            <span className="tk-when">
              以 {session.user.email} 登录 · <button className="tk-act" onClick={() => { signOut(); setSession(null); }}>退出</button>
            </span>
          ) : (
            <span className="tk-when">发布时用邮箱验证码登录</span>
          )}
        </div>
      </div>

      {mode === "email" && (
        <div className="rev-form">
          <div className="rev-row">
            <input type="email" placeholder="邮箱(仅用于验证码登录)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="cp" disabled={busy} onClick={() => void submitEmail()}>发验证码</button>
            <button className="rev-x" onClick={() => setMode("idle")}>取消</button>
          </div>
        </div>
      )}
      {mode === "code" && (
        <div className="rev-form">
          <p className="rev-tip">邮件已发到 {email}(注意垃圾箱)——<b>收到链接直接点</b>,会自动回到本页登录;收到 6 位码就在下面输:</p>
          <div className="rev-row">
            <input inputMode="numeric" placeholder="6 位验证码(如果邮件里有)" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="cp" disabled={busy || code.trim().length < 4} onClick={() => void submitCode()}>登录</button>
            <button className="rev-x" onClick={() => setMode("email")}>换邮箱</button>
          </div>
        </div>
      )}
      {err && <div className="rev-err">{err}</div>}

      {tops === null ? (
        <div className="rev-empty">…</div>
      ) : tops.length === 0 ? (
        <div className="rev-empty">还没有帖子。</div>
      ) : (
        <div>
          {tops.map((t) => {
            const all = replies.get(t.id) ?? [];
            const folded = !expanded.has(t.id) && all.length > REPLY_FOLD;
            const shown = folded ? all.slice(-REPLY_FOLD) : all;
            const inner = (
              <>
                <div className="tk-body">{t.body}</div>
                {foot(t, true)}
                {folded && (
                  <div className="tk-reply">
                    <button className="tk-act" onClick={() => setExpanded((p) => new Set(p).add(t.id))}>
                      展开全部 {all.length} 条回复
                    </button>
                  </div>
                )}
                {shown.map((r) => (
                  <div key={r.id} className="tk-reply">
                    <div className="tk-body">{r.body}</div>
                    {foot(r, false)}
                  </div>
                ))}
                {replyTo === t.id && (
                  <div className="tk-row" style={{ marginTop: 12 }}>
                    <input
                      style={{ flex: 1, maxWidth: 420 }}
                      placeholder="回复…(纯文本)"
                      maxLength={2000}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void send(replyDraft, t.id); }}
                    />
                    <button className="cp" disabled={busy} onClick={() => void send(replyDraft, t.id)}>回复</button>
                    <button className="tk-act" onClick={() => { setReplyTo(null); setReplyDraft(""); }}>取消</button>
                  </div>
                )}
              </>
            );
            return (
              <div key={t.id} className="tk-item">
                {t.official ? <div className="tk-off">{inner}</div> : inner}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
