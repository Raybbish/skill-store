export interface GitTreeEntry {
  path: string;
  type: string;
  sha: string;
}

export interface SourceHashRecord {
  path: string;
  blobSha: string;
}

export const SOURCE_HASH_ALGORITHM: "git-blob-list-sha256-v1";
export const SOURCE_HASH_EXCLUDES: readonly [".git/**", "LICENSE.upstream"];
export function isSourceHashPath(relativePath: string): boolean;
export function gitBlobSha1(content: Uint8Array | string): string;
export function sourceContentHashFromRecords(records: SourceHashRecord[]): string;
export function sourceContentHashFromTree(dirPrefix: string, entries: GitTreeEntry[]): string;
export function sourceContentHashDirectory(root: string): Promise<string>;
export function isSha256(value: unknown): value is string;
