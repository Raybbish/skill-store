/**
 * SKILL.md 正文取用(ADR 0025「怎么用」板块的数据地基)。
 *
 * 正文的三个来源,按优先级:
 *   1. mirror/SKILL.md   —— 托管副本(宽松证 + --mirror 已落盘),事实源;
 *   2. skill.md          —— 正文快照(宽松证但未镜像;ingest 顺手写 / backfill:skillmd 回填);
 *   3. 上游 raw 拉取      —— 磁盘没有时的临时取用(howto:llm 生成用完即弃,**不落盘**——
 *                            证不宽松的正文不进公开 catalog,转载红线见 ADR 0025)。
 *
 * ⚠ skill.md 快照放条目根(与 skill-report.json 同级),**不放 mirror/ 内**:
 *   mirror/ 是内容哈希与 .skill 打包的取材范围,快照不参与任何哈希与分发。
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SkillReport } from "@skill-store/schemas";
import { entryDir } from "./catalog.ts";

/** 快照文件名(小写,与上游 SKILL.md 区分;条目根下的保留名) */
export const SKILLMD_SNAPSHOT = "skill.md";

/** 单文件体积闸:超过不当正文用(与镜像 2MB 闸同哲学,正文用不着那么大) */
const MAX_BODY_BYTES = 512 * 1024;

export type BodySource = "mirror" | "snapshot";

/** 磁盘上有无正文;有则返回来源(mirror 优先——托管副本是事实源,快照只是补位) */
export function skillMdOnDisk(id: string): BodySource | null {
  const dir = entryDir(id);
  if (existsSync(join(dir, "mirror", "SKILL.md"))) return "mirror";
  if (existsSync(join(dir, SKILLMD_SNAPSHOT))) return "snapshot";
  return null;
}

/** 读磁盘正文(mirror → 快照);没有 → null */
export async function readSkillMdFromDisk(id: string): Promise<string | null> {
  const src = skillMdOnDisk(id);
  if (!src) return null;
  const dir = entryDir(id);
  const p = src === "mirror" ? join(dir, "mirror", "SKILL.md") : join(dir, SKILLMD_SNAPSHOT);
  try {
    const text = await readFile(p, "utf8");
    return text.length <= MAX_BODY_BYTES ? text : null;
  } catch {
    return null;
  }
}

/**
 * 上游 raw URL。ref 优先 upstream_commit(与 content_hash 同代采集,内容确定);
 * 拉不到时调用方可退 upstream URL 里的分支 ref(force-push 剪历史的兜底,内容可能已前进)。
 */
export function rawSkillMdUrls(r: SkillReport): string[] {
  const m = r.meta.upstream.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.*))?$/,
  );
  if (!m) return [];
  const [, owner, repo, branch, rawDir] = m;
  const dir = rawDir ? `${rawDir.replace(/\/+$/, "")}/` : "";
  const urls: string[] = [];
  if (r.meta.upstream_commit) urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${r.meta.upstream_commit}/${dir}SKILL.md`);
  urls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dir}SKILL.md`);
  return urls;
}

/**
 * 拉上游正文(commit 优先、分支兜底);任一失败/超限 → null,调用方自行降级。
 * 返回 ref 类型,便于调用方区分「与 content_hash 同代」还是「分支最新(可能已前进)」。
 */
export async function fetchSkillMd(
  r: SkillReport,
  { timeoutMs = 15000 }: { timeoutMs?: number } = {},
): Promise<{ text: string; pinned: boolean } | null> {
  const urls = rawSkillMdUrls(r);
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i], { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || text.length > MAX_BODY_BYTES) continue;
      return { text, pinned: i === 0 && !!r.meta.upstream_commit };
    } catch {
      /* 超时/网络错误 → 试下一个 ref */
    }
  }
  return null;
}
