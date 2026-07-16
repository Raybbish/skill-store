/**
 * 共享 GitHub Search API 客户端(ADR 0027 P1)。
 *
 * 所有 /search/* 采集源(github-search 仓库搜索、code-search 代码搜索)都走这里,
 * 让整趟 ingest 的搜索请求作为一个整体尊重 per-token 限流——07-15 生产验证的病根是:
 * github-search 100 次仓库搜索零间隔连发,先烧穿 per-token 的**二级(abuse/burst)限流**,
 * 轮到 code-search 时第一条 `/search/code` 就 429(remaining=10 说明主配额没满 = 二级),
 * 而二级限流常常不带 retry-after,旧逻辑只在有 retry-after 时退避,于是第一条就放弃 → 长尾停摆。
 *
 * 三件事:
 *  1. 全局最小请求间隔:跨源共享一个「上次发起时刻」,强制串行节流,避开二级触发;
 *  2. 二级限流感知退避:429、或 403 且 remaining>0 判为二级(主配额没满),
 *     无 retry-after 也固定退避(默认 60s 起、指数封顶)重试,而不是立刻收工;
 *  3. 主配额耗尽(remaining==0):等到 x-ratelimit-reset(有界)再重试。
 *  4. 小时级滑动封禁识别(ADR 0030):二级限流且 reset 距今超阈值 → 不重试立即收工
 *     ——07-16 实测这种封禁重试会续期,退避永远赢不了,唯一正确动作是留给错峰窗口。
 * 有 retry-after 一律优先按它退避;单次等待有硬上限,退避预算耗尽才把受限结果回给调用方
 * (code-search 据此判 degraded 置红,语义不变)。
 */

const TOKEN = process.env.GITHUB_TOKEN;

/** 跨源全局节流:所有 search 请求共享,强制两次请求间的最小间隔 */
const MIN_GAP_MS = Number(process.env.SEARCH_MIN_GAP_MS) || 2500;
/** 单次请求最多尝试几趟(含首次);退避重试次数 = MAX_ATTEMPTS - 1 */
const MAX_ATTEMPTS = Number(process.env.SEARCH_MAX_ATTEMPTS) || 3;
/** 二级限流且无 retry-after 时的起步退避;按尝试次数指数放大 */
const SECONDARY_BASE_MS = Number(process.env.SEARCH_SECONDARY_BACKOFF_MS) || 60_000;
/** 单次等待硬上限(含等 reset),防止把 job 拖到 timeout */
const MAX_WAIT_MS = Number(process.env.SEARCH_MAX_WAIT_MS) || 180_000;
/**
 * 二级限流下 reset 距今超过该值 → 判「小时级滑动封禁」,一发即收工不重试(ADR 0030)。
 * 07-16 实测:code_search 二级封禁的 x-ratelimit-reset 恒 ≈ now+63min,且每次重试把 reset 后移
 * ——重试不仅赢不了,还在续期封禁。
 */
const RESET_GIVEUP_MS = Number(process.env.SEARCH_RESET_GIVEUP_MS) || 600_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const num = (h: Headers | null, k: string) => {
  const v = Number(h?.get(k));
  return Number.isFinite(v) ? v : NaN;
};

export interface GhResult<T> {
  status: number;
  data: T | null;
  headers: Headers | null;
  /** 非 2xx 时的响应体前 300 字(限流诊断/权限报错);2xx 为空串 */
  body: string;
  ok: boolean;
}

/**
 * 是否二级(abuse/burst)限流。GitHub 口径:
 *  - 主配额耗尽 → 403/429 且 x-ratelimit-remaining==0,等 reset;
 *  - 二级限流   → 403/429 且 remaining 通常 >0,常不带 retry-after,官方建议至少等 1 分钟。
 * 429 且 remaining==0 记为主配额;其余 429、或 403 且 remaining>0 记为二级。
 */
export function isSecondaryLimit(status: number, remaining: number): boolean {
  if (status !== 403 && status !== 429) return false;
  return status === 429 ? remaining !== 0 : remaining > 0;
}

let lastCallAt = 0;
async function pacedFetch(url: string): Promise<Response> {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCallAt = Date.now();
  return fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "oh-my-skill-ingest",
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
}

/**
 * 发一条 GitHub Search API 请求,自带全局节流 + 限流退避重试。
 * 2xx → { ok:true, data }。限流退避耗尽或其它错误 → { ok:false, data:null, status, body },
 * 调用方按各自语义处理(github-search 抛错、code-search 收工判 degraded)。
 */
export async function searchApiFetch<T>(url: string, label = "search"): Promise<GhResult<T>> {
  for (let attempt = 0; ; attempt++) {
    const res = await pacedFetch(url);
    if (res.ok) {
      return { status: res.status, data: (await res.json()) as T, headers: res.headers, body: "", ok: true };
    }
    const headers = res.headers;
    const body = (await res.text().catch(() => "")).slice(0, 300);
    // 只对限流(403/429)退避重试;其它错误(404/422/5xx…)直接回传给调用方
    if (res.status !== 403 && res.status !== 429) {
      return { status: res.status, data: null, headers, body, ok: false };
    }
    const remaining = num(headers, "x-ratelimit-remaining");
    const retryAfter = num(headers, "retry-after");
    const reset = num(headers, "x-ratelimit-reset");
    const secondary = isSecondaryLimit(res.status, remaining);

    let waitMs: number;
    if (retryAfter > 0) waitMs = retryAfter * 1000; // 有 retry-after 一律优先
    else if (remaining === 0 && Number.isFinite(reset)) waitMs = Math.max(0, reset * 1000 - Date.now()) + 1000; // 主配额:等 reset
    else waitMs = SECONDARY_BASE_MS * 2 ** attempt; // 二级(或无头):60s → 120s → 240s…
    const capped = Math.min(waitMs, MAX_WAIT_MS);

    const kind = secondary ? "二级限流" : remaining === 0 ? "主配额耗尽" : "限流";
    console.warn(
      `  ⚠ ${label} ${res.status}(${kind})尝试 ${attempt + 1}/${MAX_ATTEMPTS}:` +
        ` retry-after=${headers?.get("retry-after") ?? "-"}` +
        ` remaining=${headers?.get("x-ratelimit-remaining") ?? "-"}` +
        ` reset=${headers?.get("x-ratelimit-reset") ?? "-"}` +
        ` resource=${headers?.get("x-ratelimit-resource") ?? "-"}`,
    );
    if (body) console.warn(`    响应体:${body}`);

    // 小时级滑动封禁(ADR 0030):二级限流 + 无 retry-after + reset 距今超阈值 → 重试只会续期,
    // 立即把受限结果交回调用方(code-search 收工判 degraded、游标保留,等错峰窗口/次日再试)。
    if (secondary && !(retryAfter > 0) && Number.isFinite(reset)) {
      const resetInMs = reset * 1000 - Date.now();
      if (resetInMs > RESET_GIVEUP_MS) {
        console.warn(
          `    reset 距今 ${Math.round(resetInMs / 60_000)} 分钟(阈值 ${Math.round(RESET_GIVEUP_MS / 60_000)} 分钟):` +
            `判为小时级滑动封禁,重试只会续期,本请求立即收工`,
        );
        return { status: res.status, data: null, headers, body, ok: false };
      }
    }

    if (attempt + 1 >= MAX_ATTEMPTS) {
      // 退避预算耗尽:回传受限结果,调用方收工(code-search → degraded → 置红)
      return { status: res.status, data: null, headers, body, ok: false };
    }
    console.warn(`    退避 ${Math.round(capped / 1000)}s 后重试`);
    await sleep(capped);
  }
}
