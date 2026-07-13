"use client";
/**
 * 短评区(ADR 0017 砖二):豆瓣短评形态——点选三档 + 可选一句话,不是知乎长文。
 * 双层门:①登录(email OTP,延迟注册:只在此刻要验证码)②名下有该 skill 回执(RLS 强制)。
 * 不合格 → 给 verify 出路(已装过的人不用重装);未配置 Supabase env → 整块隐藏,货架与今天一致。
 * 双语(ADR 0022):chrome 词典化(共享页,客户端按偏好切);用户评价内容保持原文。
 */
import { useEffect, useMemo, useState } from "react";
import { getSession, sessionFromUrlHash, signOut, type Session } from "@/lib/auth";
import SignInBox from "@/components/SignInBox";
import { eligibility, listReviews, postReview, reviewGateEnabled, reviewsConfigured, type Review } from "@/lib/reviews";
import { postReceipt, ridToken } from "@/lib/receipts";
import { fromDataTransfer, fromFileList, fromZipFile, verifyPickedDir, type PickedFile } from "@/lib/webverify";
import { relTime, type MsgKey } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const V: Record<Review["verdict"], { k: MsgKey; cls: string }> = {
  good: { k: "rev.good", cls: "rv-good" },
  ok: { k: "rev.ok", cls: "rv-ok" },
  bad: { k: "rev.bad", cls: "rv-bad" },
};

export default function SkillReviews({ skillId, contentHash, scene }: { skillId: string; contentHash?: string; scene: string[] }) {
  const tt = useT();
  const locale = useLocale();
  /** lib 层抛的 E:键值 → 按 locale 翻译;非键值原样透出 */
  const errText = (e: unknown): string => {
    const m = (e as Error).message ?? "";
    if (!m.startsWith("E:")) return m;
    const [, key, s] = m.split(":");
    return tt(key as Parameters<typeof tt>[0], s ? { s } : undefined);
  };
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"idle" | "signin" | "form" | "ineligible">("idle");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Review["verdict"] | null>(null);
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
    if (mine) { setVerdict(mine.verdict); setText(mine.text ?? ""); setSelScenes(mine.scene_tags ?? []); }
    setMode("form");
  }

  async function submitReview() {
    if (!session || !verdict) return setErr(tt("rev.pickOne"));
    setBusy(true); setErr("");
    try {
      await postReview(session, {
        skill_id: skillId, verdict, text, scene_tags: selScenes,
        author_label: nick, content_hash: receiptHash,
      });
      try { if (nick.trim()) localStorage.setItem("oms_nick", nick.trim()); } catch { /* 忽略 */ }
      setReviews(await listReviews(skillId));
      setMode("idle");
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  }

  const vfy = `npx oh-my-skill verify ${skillId}${tok ? ` --t ${tok}` : ""}`;

  /** 网页端 verify:拖/选装好的文件夹 → 本地算哈希 → 落回执 → 重查资格直进表单(零终端零路径) */
  async function handlePicked(files: PickedFile[]) {
    if (!session || busy) return;
    setBusy(true); setErr("");
    const r = await verifyPickedDir(files, { name: skillId.split("/").pop() ?? "", contentHash });
    if (r.status === "rejected") {
      setErr(r.reason ?? tt("rev.rejected"));
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
        <h2>{tt("rev.title")}{reviews?.length ? ` · ${reviews.length}` : ""}</h2>
        {mode === "idle" && (
          <button className="cp" disabled={busy} onClick={() => (session ? void enterForm(session) : setMode("signin"))}>
            {mine ? tt("rev.edit") : tt("rev.write")}
          </button>
        )}
      </div>
      {/* 文案跟服务端 flag 走,两种状态各说各的实话;标签永远按行盖章不虚标 */}
      <div className="rev-gate">{gateOn ? tt("rev.gateOn") : tt("rev.gateOff")}</div>

      {/* 统一登录组件(与 /me 同款,用户裁决 2026-07-13):原地展开,登录完直接进资格检查 */}
      {mode === "signin" && (
        <div className="rev-form">
          <SignInBox
            onSession={(s) => { setSession(s); void enterForm(s); }}
            onCancel={() => setMode("idle")}
          />
        </div>
      )}

      {mode === "ineligible" && (
        <div className="rev-form">
          <p className="rev-tip">{tt("rev.ineligible")}</p>
          {/* 系统限制:一个选择器选不了「文件夹和文件」两种——两个按钮并排放明处,拖拽两者通吃 */}
          <div
            className="rev-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void fromDataTransfer(e.dataTransfer).then((fs) => void handlePicked(fs)); }}
          >
            <div>{busy ? tt("rev.checking") : tt("rev.dropHere")}</div>
            {!busy && (
              <div className="rev-drop-btns">
                <label className="cp">
                  {tt("rev.pickDir")}
                  <input
                    type="file" hidden multiple
                    onChange={(e) => { if (e.target.files) void handlePicked(fromFileList(e.target.files)); }}
                    {...({ webkitdirectory: "" } as object)}
                  />
                </label>
                <label className="cp">
                  {tt("rev.pickFile")}
                  <input
                    type="file" hidden accept=".skill,.zip"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromZipFile(f).then((fs) => void handlePicked(fs)); }}
                  />
                </label>
              </div>
            )}
          </div>
          <details className="rev-cli">
            <summary>{tt("rev.cliAlt")}</summary>
            <div className="rev-row" style={{ marginTop: 8 }}><code className="cli">{vfy}</code></div>
            <div className="rev-row" style={{ marginTop: 8 }}>
              <button className="cp" disabled={busy} onClick={() => session && void enterForm(session)}>{tt("rev.recheck")}</button>
            </div>
          </details>
          <div className="rev-row"><button className="rev-x" onClick={() => setMode("idle")}>{tt("rev.later")}</button></div>
        </div>
      )}

      {mode === "form" && (
        <div className="rev-form">
          <div className="rev-row">
            {(Object.keys(V) as Review["verdict"][]).map((k) => (
              <button key={k} className={`rv-pick ${V[k].cls} ${verdict === k ? "on" : ""}`} onClick={() => setVerdict(k)}>{tt(V[k].k)}</button>
            ))}
          </div>
          <textarea maxLength={500} placeholder={tt("rev.textPh")} value={text} onChange={(e) => setText(e.target.value)} />
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
            <input placeholder={tt("rev.nickPh")} maxLength={24} value={nick} onChange={(e) => setNick(e.target.value)} style={{ maxWidth: 200 }} />
            {/* 不因未选档而禁用:禁用按钮零反馈,点击报「先选一档」比死按钮诚实(选档必选,文字可选) */}
            <button className="cp" disabled={busy} onClick={() => void submitReview()}>{mine ? tt("rev.update") : tt("rev.publish")}</button>
            <button className="rev-x" onClick={() => setMode("idle")}>{tt("talk.cancel")}</button>
          </div>
          <div className="rev-meta">
            {tt("talk.signedAs", { email: session?.user.email ?? (session?.user.github_login ? `@${session.user.github_login}` : "") })} · <button className="rev-x" onClick={() => { signOut(); setSession(null); setMode("idle"); }}>{tt("talk.signOut")}</button>
          </div>
        </div>
      )}
      {err && <div className="rev-err">{err}</div>}

      {reviews === null ? (
        <div className="rev-empty">…</div>
      ) : reviews.length === 0 ? (
        <div className="rev-empty">{tt("rev.empty")}</div>
      ) : (
        <div className="rev-list">
          {reviews.map((r) => (
            <div key={`${r.user_id}`} className="rev-item">
              <div className="rev-line1">
                <span className={`rv-badge ${V[r.verdict].cls}`}>{tt(V[r.verdict].k)}</span>
                <b>{r.author_label || tt("talk.user")}</b>
                {r.verified && <span className="rev-tag" title={tt("rev.verifiedTip")}>{tt("rev.verified")}</span>}
                {r.content_hash && contentHash && r.content_hash !== contentHash && (
                  <span className="rev-tag old" title={tt("rev.oldVerTip")}>{tt("rev.oldVer")}</span>
                )}
                <span className="rev-when">{relTime(locale, r.updated_at)?.rel}</span>
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
