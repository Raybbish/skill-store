import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillReport } from "@skill-store/schemas";
import { cloneShallow } from "../git.ts";
import { parseFrontmatter, normalizeName } from "../frontmatter.ts";
import { classifyLicense } from "../license.ts";
import { contentHash } from "../hash.ts";
import { computeContextSize } from "../context-size.ts";

export interface SkillCandidate {
  report: SkillReport;
  /** mirrored 时:本地克隆中该 skill 目录的绝对路径,ingest 负责整体拷贝 */
  mirrorSrcDir: string | null;
}

export interface DiscoverResult {
  candidates: SkillCandidate[];
  cleanup: () => Promise<void>;
}

/** shallow clone 一个 GitHub 仓库,发现全部 SKILL.md 并产出规范化候选 */
export async function discoverFromRepo(repoSlug: string): Promise<DiscoverResult> {
  const owner = repoSlug.split("/")[0].toLowerCase();
  const repoName = repoSlug.split("/")[1];
  const repoSeg = repoName.toLowerCase(); // ID 第二段:仓库名(小写),消除同 owner 跨仓同名撞 id
  const clone = await cloneShallow(repoSlug);
  const now = new Date().toISOString();

  // 仓库级 LICENSE(根目录)
  const repoLicenseEntry = clone.entries.find((e) =>
    /^(LICENSE|LICENCE)(\.(txt|md))?$/i.test(e.path),
  );
  const repoLicenseText = repoLicenseEntry
    ? await readFile(join(clone.dir, repoLicenseEntry.path), "utf8")
    : null;

  const skillMdPaths = clone.entries
    .filter((e) => /(^|\/)SKILL\.md$/.test(e.path))
    .map((e) => e.path);

  const candidates: SkillCandidate[] = [];
  for (const skillMdPath of skillMdPaths) {
    const dir = skillMdPath.replace(/SKILL\.md$/, ""); // 含尾部 "/",根目录时为 ""
    try {
      const md = await readFile(join(clone.dir, skillMdPath), "utf8");
      const { data: fm, issues } = parseFrontmatter(md);

      const rawName =
        (typeof fm?.name === "string" && fm.name) ||
        dir.split("/").filter(Boolean).pop() ||
        repoName;
      const name = normalizeName(rawName);

      // 目录级 LICENSE 优先;没有则回落仓库级
      const localLicenseEntry = clone.entries.find(
        (e) =>
          e.path.startsWith(dir) &&
          /^(LICENSE|LICENCE)(\.(txt|md))?$/i.test(e.path.slice(dir.length)),
      );
      const licenseText = localLicenseEntry
        ? await readFile(join(clone.dir, localLicenseEntry.path), "utf8")
        : repoLicenseText;
      const { license, hosting } = classifyLicense(null, licenseText);

      const report: SkillReport = {
        schema_version: "2",
        meta: {
          id: `${owner}/${repoSeg}/${name}`,
          name,
          // 去 NUL:描述可能字面含 (文件上传绕过等 payload),JSON 合法但 Postgres text/jsonb 不收(22P05)。
          // 源头清洗,让 catalog 与下游 DB 一致;sync 侧另有边界防御兜存量。
          description: typeof fm?.description === "string" ? fm.description.replace(/\u0000/g, "").slice(0, 1024) : undefined,
          upstream: `https://github.com/${repoSlug}/tree/${clone.branch}/${dir.replace(/\/$/, "")}`,
          upstream_commit: clone.headCommit,
          content_hash: contentHash(dir, clone.entries),
          license,
          hosting,
          // 两段式:默认只索引(不下载 mirror);INGEST_MIRROR=1 时才实际镜像
          mirror_complete: hosting === "mirrored" ? process.env.INGEST_MIRROR === "1" : undefined,
          category: null,
          version: typeof fm?.version === "string" ? fm.version : null,
          publisher: owner,
          publisher_verified: false,
          duplicate_of: null,
        },
        frontmatter_valid: issues.length === 0,
        frontmatter_issues: issues,
        // v2(ADR 0012):判定拆出至 catalog/verdicts 账本;采集不再写 security_audit
        // first_seen_at 默认盖发现时刻;更新既有条目时 ingest 会用旧值顶掉(盖一次、永不覆盖,ADR 0016)
        signals: { stars_github: null, installs_skills_sh: null, fetched_at: now, first_seen_at: now, upstream_commit_at: clone.headCommitAt },
        context_size: await computeContextSize({ root: clone.dir, dirPrefix: dir, skillMd: md, entries: clone.entries, generatedAt: now }),
        eval: null,
      };

      candidates.push({
        report,
        // 索引阶段不镜像(海量、近零成本);仅 INGEST_MIRROR=1 且 licence 允许时下载副本
        mirrorSrcDir: process.env.INGEST_MIRROR === "1" && hosting === "mirrored" ? join(clone.dir, dir) : null,
      });
    } catch (e) {
      console.warn(`  ✗ 跳过 ${repoSlug}:${dir || "(root)"} — ${(e as Error).message}`);
    }
  }
  return { candidates, cleanup: clone.cleanup };
}
