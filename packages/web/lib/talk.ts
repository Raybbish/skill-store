/**
 * 公海讨论区取数(ADR 0021):列表匿名读;发帖/回复只需登录(email OTP,复用 auth.ts)。
 * 不设回执门——公海是说话的地方,不是评价凭证(区别于 reviews 的双层门)。
 * 未配置 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 时 no-op,页面显示「未启用」。
 */
import { authConfigured, type Session } from "./auth";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface Post {
  id: number;
  user_id: string;
  reply_to: number | null;
  body: string;
  author_label: string | null;
  /** 主理人署名帖(服务端置位,插入 RLS 强制 false——不可冒名) */
  official: boolean;
  created_at: string;
}

export const talkConfigured = authConfigured;

const anonHeaders = { apikey: KEY, authorization: `Bearer ${KEY}` };
const SELECT = "id,user_id,reply_to,body,author_label,official,created_at";

/** 首屏:最新 50 楼 + 全部回复(楼新在前,回复楼内旧在前) */
export async function listThreads(): Promise<{ tops: Post[]; replies: Map<number, Post[]> }> {
  const empty = { tops: [] as Post[], replies: new Map<number, Post[]>() };
  if (!URL || !KEY) return empty;
  const q = new URLSearchParams({ select: SELECT, reply_to: "is.null", order: "created_at.desc", limit: "50" });
  const r = await fetch(`${URL}/rest/v1/posts?${q}`, { headers: anonHeaders });
  if (!r.ok) return empty;
  const tops = (await r.json()) as Post[];
  const replies = new Map<number, Post[]>();
  if (tops.length) {
    const rq = new URLSearchParams({
      select: SELECT, reply_to: `in.(${tops.map((t) => t.id).join(",")})`, order: "created_at.asc", limit: "500",
    });
    const rr = await fetch(`${URL}/rest/v1/posts?${rq}`, { headers: anonHeaders });
    if (rr.ok) {
      for (const p of (await rr.json()) as Post[]) {
        const arr = replies.get(p.reply_to!) ?? [];
        arr.push(p);
        replies.set(p.reply_to!, arr);
      }
    }
  }
  return { tops, replies };
}

/** 发楼/回复(RLS:登录 + official 恒 false;触发器:一层回复 + 60s 频率闸) */
export async function postMessage(s: Session, body: string, replyTo?: number, authorLabel?: string): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/posts`, {
    method: "POST",
    headers: {
      apikey: KEY, authorization: `Bearer ${s.access_token}`,
      "content-type": "application/json", prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: s.user.id,
      body: body.trim(),
      reply_to: replyTo ?? null,
      author_label: authorLabel?.trim() || null,
    }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    if (err.includes("rate_limited")) throw new Error("发得有点快——间隔 1 分钟再发");
    if (err.includes("reply_depth")) throw new Error("只支持一层回复");
    if (r.status === 404) throw new Error("讨论区后端未初始化(posts 表缺失,需执行 2026-07-09-talk.sql 迁移)");
    throw new Error(`发布失败(${r.status})`);
  }
}

/** 删自己的帖(删楼级联删回复,RLS 只放行本人行) */
export async function deletePost(s: Session, id: number): Promise<void> {
  const r = await fetch(`${URL}/rest/v1/posts?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: KEY, authorization: `Bearer ${s.access_token}` },
  });
  if (!r.ok) throw new Error(`删除失败(${r.status})`);
}
