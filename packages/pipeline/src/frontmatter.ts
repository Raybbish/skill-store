import { parse } from "yaml";

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

/** 统一成 kebab-case 的 skill 名 */
export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
