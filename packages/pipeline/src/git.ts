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

/** git clone 硬超时:巨仓/网络卡住到点 SIGKILL,抛错交上层各源 try/catch 跳过该仓,不再拖垮整趟
 *  (ADR 0027:失败要有界。曾有单仓 clone 挂住让整趟 ingest 卡 35 分钟无进展)。env CLONE_TIMEOUT_MS 覆盖。 */
const CLONE_TIMEOUT_MS = Number(process.env.CLONE_TIMEOUT_MS) || 120_000;

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
  try {
    await exec("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${repoSlug}.git`, dir], {
      maxBuffer: 64 * 1024 * 1024,
      timeout: CLONE_TIMEOUT_MS, // 到点抛 ETIMEDOUT
      killSignal: "SIGKILL", // 网络卡死的 git 可能不理 SIGTERM,直接 KILL
    });
  } catch (e) {
    // 半成品克隆会占满 runner 磁盘(巨仓半下载),清掉再上抛;上层各源接住后跳过该仓
    await rm(dir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }
  const headCommit = (await exec("git", ["-C", dir, "rev-parse", "HEAD"])).stdout.trim();
  // 上游仓库最近一次提交时间(--depth 1 → HEAD 即唯一 commit;仓库级,非单 skill 路径级)
  const headCommitAt = (await exec("git", ["-C", dir, "log", "-1", "--format=%cI"])).stdout.trim();
  const branch = (await exec("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"])).stdout.trim();
  // -z:NUL 分隔且路径不做引号转义。默认 core.quotePath 会把非 ASCII 路径转成 "\346\226\207..." 带引号形态,
  // 中文目录下的 SKILL.md 会因此匹配不上、静默漏抓——正打在中文创作者源上(ADR 0027)
  const lsOut = (
    await exec("git", ["-C", dir, "ls-tree", "-r", "-z", "HEAD"], { maxBuffer: 256 * 1024 * 1024 })
  ).stdout;

  const entries: TreeEntry[] = [];
  for (const line of lsOut.split("\0")) {
    if (!line) continue;
    // 格式:<mode> <type> <sha>\t<path>
    const tab = line.indexOf("\t");
    const [, type, sha] = line.slice(0, tab).split(/\s+/);
    if (type === "blob") entries.push({ path: line.slice(tab + 1), type: "blob", sha });
  }

  return { dir, headCommit, headCommitAt, branch, entries, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
