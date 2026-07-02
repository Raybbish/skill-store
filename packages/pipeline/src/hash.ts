import { createHash } from "node:crypto";
import type { TreeEntry } from "./git.ts";

/**
 * content_hash:对 skill 目录内全部 blob 的 (相对路径, git blob sha) 排序集合取 sha256。
 * git blob sha 本身就是内容寻址,因此无需下载每个文件即可得到稳定的内容指纹;
 * CLI 安装时用同样算法对本地文件重算校验(git hash-object 算法)。
 */
export function contentHash(dirPrefix: string, entries: TreeEntry[]): string {
  const lines = entries
    .filter((e) => e.type === "blob" && e.path.startsWith(dirPrefix))
    .map((e) => `${e.path.slice(dirPrefix.length)}:${e.sha}`)
    .sort();
  const h = createHash("sha256");
  h.update(lines.join("\n"));
  return `sha256:${h.digest("hex")}`;
}

const SCRIPT_EXT = /\.(py|sh|bash|zsh|js|mjs|cjs|ts|rb|pl|ps1|bat|cmd|exe|bin)$/i;

/** 采集期静态清点:目录里有哪些可执行脚本(pre-audit 提示,非审计结论) */
export function inventoryScripts(dirPrefix: string, entries: TreeEntry[]): string[] {
  return entries
    .filter((e) => e.type === "blob" && e.path.startsWith(dirPrefix) && SCRIPT_EXT.test(e.path))
    .map((e) => e.path.slice(dirPrefix.length));
}
