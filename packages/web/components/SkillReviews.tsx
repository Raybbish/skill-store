"use client";
/**
 * 短评区(ADR 0017 砖二):豆瓣短评形态——点选三档 + 可选一句话,不是知乎长文。
 * 双层门:①登录(email OTP,延迟注册:只在此刻要验证码)②名下有该 skill 回执(RLS 强制)。
 * 不合格 → 给 verify 出路(已装过的人不用重装);未配置 Supabase env → 整块隐藏,货架与今天一致。
 */
import { useEffect, useMemo, useState } from "react";
import { getSession, requestOtp, sessionFromUrlHash, signOut, verifyOtp, type Session } from "@/lib/auth";
import { eligibility, listReviews, postReview, reviewGateEnabled, reviewsConfigured, type Review } from "@/lib/reviews";
import { postReceipt, ridToken } from "@/lib/receipts";
import { fromDataTransfer, fromFileList, fromZipFile, verifyPickedDir, type PickedFile } from "@/lib/webverify";

/** 1-5 星显示(2026-07-09 由三档改星):实心金星 + 空星,只读 */
function Stars({ n }: { n: number }) {
  return (
    <span className="rv-stars" title={`${n} 星`}>
      <span className="on">{"★".repeat(n)}</span>
      <span className="off">{"★".repeat(5 - n)}</span>
    </span>
  );
}

function rel(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return days <= 0 ? "今天" : days < 7 ? `${days} 天前` : days < 30 ? `${Math.floor(days / 7)} 周前`
    : days < 365 ? `${Math.floor(days / 30)} 个月前` : `${Math.floor(days / 365)} 年前`;
}

export default function SkillReviews({ skillId, contentHash, scene }: { skillId: string; contentHash?: string; scene: string[] }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"idle" | "email" | "code" | "form" | "ineligible">("idle");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0); // 0 = 未选
  const [text, setText] = useState("");
  const [nick, setNick] = useState("");
  const [selScenes, setSelScenes] = useState<string[]>([]);
  const [tok, setTok] = useState("");
  const [gateOn, setGateOn] = useState(false); // 资格门开关(服务端 flag),只影响文案;拦截由资格 RPC 决定

  useEffect(() => {
    if (!reviewsConfigured()) return;
    void listReviews(skillId).then(setReviews);
    void reviewGateEnabled().then(setGateOn);
    setTok(ridToken());
    try { setNick(localStorage.getItem("oms_nick") ?? ""); } catch { /* 忽略 */ }
    // 先接魔法链接回跳(hash 令牌),命中则视为「用户正要写短评」直接进表单;否则取既有会话。
    // ?claim=1 = GitHub 认领回跳(SkillClaim 负责),此时只收会话、不抢着开评价表单。
    const isClaimReturn = new URLSearchParams(window.location.search).has("claim");
    void sessionFromUrlHash().then((fromLink) => {
      if (fromLink) { setSession(fromLink); if (!isClaimReturn) void enterForm(fromLink); }
      else void getSession().then(setSession);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  const mine = useMemo(
    () => (session ? reviews?.find((r) => r.user_id === session.user.id) ?? null : null),
    [reviews, session],
  );

  if (!reviewsConfigured()) return null;

  async function enterForm(s: Session) {
    setBusy(true); setErr("");
    const e = await eligibility(s, skillId);
    setBusy(false);
    if (!e.eligible) return setMode("ineligible");
    setReceiptHash(e.receiptHash);
    if (mine) { setRating(mine.rating); setText(mine.text ?? ""); setSelScenes(mine.scene_tags ?? []); }
    setMode("form");
  }

  async function submitEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("邮箱格式不对");
    setBusy(true); setErr("");
    // redirect_to = 当前详情页:点邮件里的链接直接回到这条 skill,hash 会话由 mount 时接住
    try { await requestOtp(email, window.location.href); setMode("code"); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function submitCode() {
    setBusy(true); setErr("");
    try {
      const s = await verifyOtp(email, code);
      setSession(s);
      await enterForm(s);
    } catch (e) { setErr((e as Error).message || "验证码不对或已过期"); }
    setBusy(false);
  }

  async function submitReview() {
    if (!session || rating < 1) return setErr("先打个分:1-5 星");
    setBusy(true); setErr("");
    try {
      await postReview(session, {
        skill_id: skillId, rating, text, scene_tags: selScenes,
        author_label: nick, content_hash: receiptHash,
      });
      try { if (nick.trim()) localStorage.setItem("oms_nick", nick.trim()); } catch { /* 忽略 */ }
      setReviews(await listReviews(skillId));
      setMode("idle");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  const vfy = `npx oh-my-skill verify ${skillId}${tok ? ` --t ${tok}` : ""}`;

  /** 网页端 verify:拖/选装好的文件夹 → 本地算哈希 → 落回执 → 重查资格直进表单(零终端零路径) */
  async function handlePicked(files: PickedFile[]) {
    if (!session || busy) return;
    setBusy(true); setErr("");
    const r = await verifyPickedDir(files, { name: skillId.split("/").pop() ?? "", contentHash });
    if (r.status === "rejected") {
      setErr(r.reason ?? "校验未通过");
      setBusy(false);
      return;
    }
    await postReceipt(skillId, "verify", r.hash); // 回执落行(rid 名下,enterForm 里会并入账号)
    setBusy(false);
    await enterForm(session);
  }

  return (
    <section className="rev">
      <div className="rev-h">
        <h2>短评{reviews?.length ? ` · ${reviews.length}` : ""}</h2>
        {mode === "idle" && (
          <button className="cp" disabled={busy} onClick={() => (session ? void enterForm(session) : setMode("email"))}>
            {mine ? "改我的短评" : "写短评"}
          </button>
        )}
      </div>
      {/* 文案跟服务端 flag 走,两种状态各说各的实话;标签永远按行盖章不虚标 */}
      <div className="rev-gate">
        {gateOn
          ? "发布需要「已验证安装」:装过(或验证过本机副本)的人才可评。"
          : "登录即可发短评;带「已验证安装」标记的,发布者名下有本店的安装或持有记录。"}
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

      {mode === "ineligible" && (
        <div className="rev-form">
          <p className="rev-tip">你的账号名下还没有这个 skill 的记录。<b>装过?</b>把装好的文件夹、或 <code>.skill</code> / <code>.zip</code> 安装包拖进下面——校验在你电脑本地完成,<b>文件不会上传</b>,只核对内容指纹:</p>
          {/* 系统限制:一个选择器选不了「文件夹和文件」两种——两个按钮并排放明处,拖拽两者通吃 */}
          <div
            className="rev-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void fromDataTransfer(e.dataTransfer).then((fs) => void handlePicked(fs)); }}
          >
            <div>{busy ? "校验中…" : "把装好的文件夹,或 .skill / .zip 安装包,拖到这里"}</div>
            {!busy && (
              <div className="rev-drop-btns">
                <label className="cp">
                  选文件夹
                  <input
                    type="file" hidden multiple
                    onChange={(e) => { if (e.target.files) void handlePicked(fromFileList(e.target.files)); }}
                    {...({ webkitdirectory: "" } as object)}
                  />
                </label>
                <label className="cp">
                  选 .skill / .zip 文件
                  <input
                    type="file" hidden accept=".skill,.zip"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromZipFile(f).then((fs) => void handlePicked(fs)); }}
                  />
                </label>
              </div>
            )}
          </div>
          <details className="rev-cli">
            <summary>习惯终端?一条命令也行</summary>
            <div className="rev-row" style={{ marginTop: 8 }}><code className="cli">{vfy}</code></div>
            <div className="rev-row" style={{ marginTop: 8 }}>
              <button className="cp" disabled={busy} onClick={() => session && void enterForm(session)}>验证完了,重新检查</button>
            </div>
          </details>
          <div className="rev-row"><button className="rev-x" onClick={() => setMode("idle")}>先不评</button></div>
        </div>
      )}

      {mode === "form" && (
        <div className="rev-form">
          <div className="rev-row rv-rate" role="radiogroup" aria-label="打分(1-5 星)">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`rv-star ${rating >= n ? "on" : ""}`}
                aria-label={`${n} 星`}
                onClick={() => setRating(n)}
              >★</button>
            ))}
            {rating > 0 && <span className="rev-when" style={{ alignSelf: "center" }}>{rating} 星</span>}
          </div>
          <textarea maxLength={500} placeholder="一句话(可选):它帮你做成了什么?哪里要注意?" value={text} onChange={(e) => setText(e.target.value)} />
          {scene.length > 0 && (
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
            <input placeholder="署名(可选,默认「用户」)" maxLength={24} value={nick} onChange={(e) => setNick(e.target.value)} style={{ maxWidth: 200 }} />
            {/* 不因未选档而禁用:禁用按钮零反馈,点击报「先选一档」比死按钮诚实(选档必选,文字可选) */}
            <button className="cp" disabled={busy} onClick={() => void submitReview()}>{mine ? "更新" : "发布"}</button>
            <button className="rev-x" onClick={() => setMode("idle")}>取消</button>
          </div>
          <div className="rev-meta">
            以 {session?.user.email} 登录 · <button className="rev-x" onClick={() => { signOut(); setSession(null); setMode("idle"); }}>退出</button>
          </div>
        </div>
      )}
      {err && <div className="rev-err">{err}</div>}

      {reviews === null ? (
        <div className="rev-empty">…</div>
      ) : reviews.length === 0 ? (
        <div className="rev-empty">还没有短评——装过的人都可以留一条。</div>
      ) : (
        <div className="rev-list">
          {reviews.map((r) => (
            <div key={`${r.user_id}`} className="rev-item">
              <div className="rev-line1">
                <Stars n={r.rating} />
                <b>{r.author_label || "用户"}</b>
                {r.verified && <span className="rev-tag" title="发布者名下有该 skill 的安装/持有记录">已验证安装</span>}
                {r.content_hash && contentHash && r.content_hash !== contentHash && (
                  <span className="rev-tag old" title="发布后内容已更新">评于旧版本</span>
                )}
                <span className="rev-when">{rel(r.updated_at)}</span>
              </div>
              {r.text && <p className="rev-text">{r.text}</p>}
              {r.scene_tags && r.scene_tags.length > 0 && (
                <div className="rev-scenes-ro">{r.scene_tags.map((w) => <span key={w} className="sc">{w}</span>)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
