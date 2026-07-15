import { createHash } from "node:crypto";
import { lstat, readFile, readdir, readlink } from "node:fs/promises";
import { join } from "node:path";

export const SOURCE_HASH_ALGORITHM = "git-blob-list-sha256-v1";
export const SOURCE_HASH_EXCLUDES = Object.freeze([".git/**", "LICENSE.upstream"]);

const comparePath = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Reserved store metadata and VCS internals never contribute to source/projection hashes. */
export function isSourceHashPath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath) return false;
  const segments = relativePath.split("/");
  if (segments.includes(".git")) return false;
  return segments.at(-1) !== "LICENSE.upstream";
}

export function gitBlobSha1(content) {
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

export function sourceContentHashFromRecords(records) {
  const lines = records
    .filter((entry) => isSourceHashPath(entry.path))
    .map((entry) => `${entry.path}:${entry.blobSha}`)
    .sort(comparePath);
  return `sha256:${createHash("sha256").update(lines.join("\n")).digest("hex")}`;
}

/** Compute the catalog hash directly from a Git tree without downloading blobs again. */
export function sourceContentHashFromTree(dirPrefix, entries) {
  const rawPrefix = String(dirPrefix ?? "").replaceAll("\\", "/");
  const prefix = rawPrefix && !rawPrefix.endsWith("/") ? `${rawPrefix}/` : rawPrefix;
  return sourceContentHashFromRecords(entries
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(prefix))
    .map((entry) => ({ path: entry.path.slice(prefix.length), blobSha: entry.sha })));
}

async function directoryRecords(root) {
  const records = [];
  async function walk(absoluteDir, relativeDir) {
    const names = await readdir(absoluteDir);
    names.sort(comparePath);
    for (const name of names) {
      const relativePath = relativeDir ? `${relativeDir}/${name}` : name;
      if (!isSourceHashPath(relativePath)) continue;
      const absolutePath = join(absoluteDir, name);
      const info = await lstat(absolutePath);
      if (info.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (info.isSymbolicLink()) {
        // Git hashes a symlink's link target bytes, not the bytes of the file it points at.
        records.push({ path: relativePath, blobSha: gitBlobSha1(Buffer.from(await readlink(absolutePath))) });
      } else if (info.isFile()) {
        records.push({ path: relativePath, blobSha: gitBlobSha1(await readFile(absolutePath)) });
      } else {
        throw new Error(`source hash 不支持特殊文件:${relativePath}`);
      }
    }
  }
  await walk(root, "");
  return records;
}

export async function sourceContentHashDirectory(root) {
  return sourceContentHashFromRecords(await directoryRecords(root));
}

export function isSha256(value) {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/i.test(value);
}
