import { parse } from "yaml";
import { createHash } from "node:crypto";

export interface FrontmatterResult {
  data: Record<string, unknown> | null;
  issues: string[];
}

/** 解析 SKILL.md 的 YAML frontmatter 并做 agentskills.io 最小规范校验 */
export function parseFrontmatter(md: string): FrontmatterResult {
  const issues: string[] = [];
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: null, issues: ["缺少 YAML frontmatter"] };

  let data: Record<string, unknown>;
  try {
    const parsed = parse(m[1]);
    if (typeof parsed !== "object" || parsed === null) {
      return { data: null, issues: ["frontmatter 不是对象"] };
    }
    data = parsed as Record<string, unknown>;
  } catch (e) {
    return { data: null, issues: [`frontmatter YAML 解析失败: ${(e as Error).message}`] };
  }

  const name = data.name;
  if (typeof name !== "string" || name.length === 0) issues.push("缺少 name");
  else if (name.length > 64) issues.push("name 超过 64 字符");

  const desc = data.description;
  if (typeof desc !== "string" || desc.length === 0) issues.push("缺少 description");
  else if (desc.length > 1024) issues.push("description 超过 1024 字符");

  return { data, issues };
}

/**
 * 统一成 kebab-case 的 skill 名。保证**非空**:纯非 ASCII / 纯符号的名字清洗后会变空串,
 * 此时用原串的短哈希兜底(稳定、同输入同名、不同输入不撞),避免 id 出现空 name 段
 * (如 `owner/repo/`,既违反 schema 的三段式,又让 sync 路径反推拼错)。
 */
export function normalizeName(raw: string): string {
  const n = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (n) return n;
  return "skill-" + createHash("sha256").update(raw).digest("hex").slice(0, 8);
}
