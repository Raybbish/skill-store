/**
 * 短评取数(ADR 0017 砖二):列表匿名可读;写入走双层门(登录 + 名下回执,由 RLS 强制)。
 * 静态站直连 Supabase REST;未配置 env 时 no-op(组件整块隐藏,货架外观与今天一致)。
 */
import { authConfigured, claimReceipts, type Session } from "./auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface Review {
  user_id: string;
  skill_id: string;
  /** 1-5 星(2026-07-09 由三档改星;豆瓣同款) */
  rating: number;
  text: string | null;
  scene_tags: string[] | null;
  author_label: string | null;
  content_hash: string | null;
  /** 发布时名下确有回执(服务端触发器盖章,不可伪造);资格门开关不影响其真实性 */
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export const reviewsConfigured = authConfigured;

const anonHeaders = { apikey: KEY, authorization: `Bearer ${KEY}` };

/** 资格门当前开关(匿名可查):前端文案与拦截行为跟着服务端 flag 走,不写死 */
export async function reviewGateEnabled(): Promise<boolean> {
  if (!URL || !KEY) return false;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/review_gate_enabled`, {
      method: "POST",
      headers: { ...anonHeaders, "content-type": "application/json" },
      body: "{}",
    });
    return r.ok ? Boolean(await r.json()) : false;
  } catch {
    return false;
  }
}

export async function listReviews(skillId: string): Promise<Review[]> {
  if (!URL || !KEY) return [];
  const q = new URLSearchParams({
    skill_id: `eq.${skillId}`,
    select: "user_id,skill_id,rating,text,scene_tags,author_label,content_hash,verified,created_at,updated_at",
    order: "updated_at.desc",
    limit: "100",
  });
  const r = await fetch(`${URL}/rest/v1/reviews?${q}`, { headers: anonHeaders });
  return r.ok ? ((await r.json()) as Review[]) : [];
}

/** 资格 + 评于版本(先并入匿名回执再查——覆盖「登录后才产生回执」的时序) */
export async function eligibility(s: Session, skillId: string): Promise<{ eligible: boolean; receiptHash: string | null }> {
  await claimReceipts(s);
  const r = await fetch(`${URL}/rest/v1/rpc/review_eligibility`, {
    method: "POST",
    headers: { apikey: KEY, authorization: `Bearer ${s.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ p_skill_id: skillId }),
  });
  if (!r.ok) return { eligible: false, receiptHash: null };
  const rows = (await r.json()) as { eligible: boolean; receipt_hash: string | null }[];
  return { eligible: Boolean(rows[0]?.eligible), receiptHash: rows[0]?.receipt_hash ?? null };
}

/** 提交/覆盖短评(UNIQUE(user,skill) 上的 upsert;RLS 复核双层门) */
export async function postReview(
  s: Session,
  review: { skill_id: string; rating: number; text?: string; scene_tags?: string[]; author_label?: string; content_hash?: string | null },
): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/reviews?on_conflict=user_id,skill_id`, {
    method: "POST",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${s.access_token}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: s.user.id,
      skill_id: review.skill_id,
      rating: review.rating,
      text: review.text?.trim() || null,
      scene_tags: review.scene_tags?.length ? review.scene_tags : null,
      author_label: review.author_label?.trim() || null,
      content_hash: review.content_hash ?? null,
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(err.includes("row-level security") ? "还差一步:短评需要「已验证安装」——先装过或跑一次 verify" : `提交失败(${r.status})`);
  }
}
