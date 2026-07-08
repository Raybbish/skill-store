/**
 * git clone 模式的仓库访问:相比 REST API 无速率限制、可获得全部文件(完整镜像)。
 * github.ts 保留用于 signals 补充(stars 等,仅在 API 可达环境下运行)。
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const exec = promisify(execFile);

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

export interface ClonedRepo {
  dir: string;
  headCommit: string;
  /** HEAD commit 提交时间(ISO 8601,%cI)= 上游仓库最近一次提交时间。--depth 1 故为**仓库级**
   *  (monorepo 内各 skill 共享同一 HEAD 时间),非单 skill 路径级;用作维护活性信号 upstream_commit_at。 */
  headCommitAt: string;
  branch: string;
  entries: TreeEntry[];
  cleanup: () => Promise<void>;
}

export async function cloneShallow(repoSlug: string): Promise<ClonedRepo> {
  const dir = await mkdtemp(join(tmpdir(), "skill-ingest-"));
  await exec("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${repoSlug}.git`, dir], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const headCommit = (await exec("git", ["-C", dir, "rev-parse", "HEAD"])).stdout.trim();
  // 上游仓库最近一次提交时间(--depth 1 → HEAD 即唯一 commit;仓库级,非单 skill 路径级)
  const headCommitAt = (await exec("git", ["-C", dir, "log", "-1", "--format=%cI"])).stdout.trim();
  const branch = (await exec("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"])).stdout.trim();
  const lsOut = (
    await exec("git", ["-C", dir, "ls-tree", "-r", "HEAD"], { maxBuffer: 256 * 1024 * 1024 })
  ).stdout;

  const entries: TreeEntry[] = [];
  for (const line of lsOut.split("\n")) {
    if (!line) continue;
    // 格式:<mode> <type> <sha>\t<path>
    const tab = line.indexOf("\t");
    const [, type, sha] = line.slice(0, tab).split(/\s+/);
    if (type === "blob") entries.push({ path: line.slice(tab + 1), type: "blob", sha });
  }

  return { dir, headCommit, headCommitAt, branch, entries, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
