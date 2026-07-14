/**
 * 评论区取数(ADR 0026,就地改造自「短评」砖二):
 * - 列表匿名可读(含顶/踩计数);写(发/回复/删/投票)只需登录,由 RLS 强制(去回执门)。
 * - 一人一 skill 可多发;一层回复(reply_to);顶/踩一人一票可反悔(review_votes upsert / delete)。
 * - 静态站直连 Supabase REST;未配 env 时 no-op(组件整块隐藏,货架与今天一致)。
 */
import { authConfigured, type Session } from "./auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type Verdict = "good" | "ok" | "bad";

export interface Review {
  id: number;
  user_id: string;
  skill_id: string;
  /** 非空 = 这是对某条主楼的回复;主楼此值为 null */
  reply_to: number | null;
  /** 可选(评论可纯文本);回复行恒为 null(DB 约束) */
  verdict: Verdict | null;
  text: string | null;
  scene_tags: string[] | null;
  author_label: string | null;
  content_hash: string | null;
  /** 发布时作者名下确有回执(服务端盖章,不可伪造);去门后它是徽章不是资格 */
  verified: boolean;
  up: number;
  down: number;
  created_at: string;
  updated_at: string;
}

export const reviewsConfigured = authConfigured;

const anonHeaders = { apikey: KEY, authorization: `Bearer ${KEY}` };
const REVIEW_COLS =
  "id,user_id,skill_id,reply_to,verdict,text,scene_tags,author_label,content_hash,verified,up,down,created_at,updated_at";

/** 一个 skill 下的全部评论(主楼+回复),按时间升序;树由组件层拼 */
export async function listReviews(skillId: string): Promise<Review[]> {
  if (!URL || !KEY) return [];
  const q = new URLSearchParams({
    skill_id: `eq.${skillId}`,
    select: REVIEW_COLS,
    order: "created_at.asc",
    limit: "500",
  });
  const r = await fetch(`${URL}/rest/v1/reviews?${q}`, { headers: anonHeaders });
  return r.ok ? ((await r.json()) as Review[]) : [];
}

/** 当前登录用户在这些评论上投过的票:review_id → 1(顶) / -1(踩)。select 公开,匿名 key 即可查。 */
export async function listMyVotes(session: Session, reviewIds: number[]): Promise<Record<number, 1 | -1>> {
  if (!URL || !KEY || reviewIds.length === 0) return {};
  const q = new URLSearchParams({
    review_id: `in.(${reviewIds.join(",")})`,
    user_id: `eq.${session.user.id}`,
    select: "review_id,value",
  });
  const r = await fetch(`${URL}/rest/v1/review_votes?${q}`, { headers: anonHeaders });
  if (!r.ok) return {};
  const rows = (await r.json()) as { review_id: number; value: 1 | -1 }[];
  return Object.fromEntries(rows.map((v) => [v.review_id, v.value]));
}

/** lib 抛 E:键值,组件层按 locale 翻译(ADR 0022:lib 语言无关) */
function throwPg(body: string, status: number): never {
  const b = body.toLowerCase();
  if (b.includes("rate_limited")) throw new Error("E:rev.rate");
  if (b.includes("reply_target")) throw new Error("E:rev.replyErr");
  if (b.includes("row-level security")) throw new Error("E:rev.loginHint");
  throw new Error(`E:rev.failed:${status}`);
}

/** 发一条评论;reply_to 非空 = 回复(不带 verdict/scene_tags,由调用方与 DB 约束共同保证)。插入,非 upsert。 */
export async function postComment(
  session: Session,
  c: {
    skill_id: string;
    reply_to?: number | null;
    verdict?: Verdict | null;
    text?: string;
    scene_tags?: string[];
    author_label?: string;
    content_hash?: string | null;
  },
): Promise<void> {
  const isReply = c.reply_to != null;
  const r = await fetch(`${URL}/rest/v1/reviews`, {
    method: "POST",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: session.user.id,
      skill_id: c.skill_id,
      reply_to: c.reply_to ?? null,
      verdict: isReply ? null : c.verdict ?? null,
      text: c.text?.trim() || null,
      scene_tags: isReply ? null : c.scene_tags?.length ? c.scene_tags : null,
      author_label: c.author_label?.trim() || null,
      content_hash: isReply ? null : c.content_hash ?? null,
    }),
  });
  if (!r.ok) throwPg(await r.text().catch(() => ""), r.status);
}

/** 删自己的评论(物理删,级联删其回复) */
export async function deleteComment(session: Session, id: number): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/reviews?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...anonHeaders, authorization: `Bearer ${session.access_token}`, prefer: "return=minimal" },
  });
  if (!r.ok) throwPg(await r.text().catch(() => ""), r.status);
}

/** 顶/踩:一人一票,切换走 upsert(同一评论改票即覆盖)。value:1=顶,-1=踩。 */
export async function castVote(session: Session, reviewId: number, value: 1 | -1): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/review_votes?on_conflict=review_id,user_id`, {
    method: "POST",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ review_id: reviewId, user_id: session.user.id, value }),
  });
  if (!r.ok) throwPg(await r.text().catch(() => ""), r.status);
}

/** 取消我的票(再点同一档 = 取消) */
export async function clearVote(session: Session, reviewId: number): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/review_votes?review_id=eq.${reviewId}&user_id=eq.${session.user.id}`, {
    method: "DELETE",
    headers: { ...anonHeaders, authorization: `Bearer ${session.access_token}`, prefer: "return=minimal" },
  });
  if (!r.ok) throwPg(await r.text().catch(() => ""), r.status);
}
