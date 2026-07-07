import { readFile, realpath, stat } from "node:fs/promises";
import { join, sep } from "node:path";
import type { ContextSize, ContextSizeScope } from "@skill-store/schemas";
import type { TreeEntry } from "./git.ts";

const TEXT_EXT = new Set([
  ".md", ".markdown", ".mdx", ".txt", ".rst", ".adoc",
  ".json", ".jsonl", ".yaml", ".yml", ".toml", ".xml",
  ".html", ".htm", ".css", ".scss",
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".php",
  ".sh", ".bash", ".zsh", ".ps1", ".sql", ".csv", ".tsv",
]);
const EXCLUDE_NAME = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
const EXCLUDE_SEGMENT = new Set([".git", "node_modules", "dist", "build", ".next", "__pycache__"]);
const MAX_TEXT_FILE_BYTES = 256 * 1024;

/**
 * 估算管线版本号。语义变了就 bump——ingest 幂等闸用它识别「旧版本算的」存量并外科式重算。
 * v1   → v1.1:引用匹配改大小写不敏感(SKILL.md 写 FORMS.md、盘上是 forms.md,
 *        在大小写不敏感文件系统上运行时真实可达);license 族文件从 refs 候选排除。
 */
export const CONTEXT_SIZE_COUNTER_ID = "static-mixed-estimate-v1.1";

// 法律样板不是装载资源:从「含声明引用」候选排除(仍计入文本包总量)。
// frontmatter 常见 `license: Complete terms in LICENSE.txt`,属声明许可证而非声明引用。
const LICENSE_FILE_RE = /^(license|licence|notice|copying)(\.[a-z0-9]+)?$/i;

function ext(path: string): string {
  const i = path.lastIndexOf(".");
  return i >= 0 ? path.slice(i).toLowerCase() : "";
}

function isTextPath(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((p) => EXCLUDE_SEGMENT.has(p))) return false;
  const name = parts[parts.length - 1] ?? "";
  if (EXCLUDE_NAME.has(name)) return false;
  return TEXT_EXT.has(ext(path));
}

/**
 * 读包内文本文件。两条排除规则(缺席即缺席,连 scope.files 清单也不进):
 * - 单文件 > MAX_TEXT_FILE_BYTES 不计入(数据集/生成物不属于「装载体积」);
 * - symlink 解析(realpath)到 clone 之外的不读——git tree 会把 symlink 当 blob 列出,
 *   恶意仓库可用 `x.md -> /etc/passwd` 让采集机读任意文件;仓内软链(合集仓常用)照常跟随。
 */
async function readTextFile(realRoot: string, dir: string, rel: string): Promise<string | null> {
  try {
    const abs = join(dir, rel);
    const real = await realpath(abs);
    if (real !== realRoot && !real.startsWith(realRoot + sep)) return null;
    const st = await stat(abs);
    if (!st.isFile() || st.size > MAX_TEXT_FILE_BYTES) return null;
    return await readFile(abs, "utf8");
  } catch {
    return null;
  }
}

function estimateStaticTokens(text: string): number {
  if (!text) return 0;
  const cjk = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const withoutCjk = text.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ");
  const words = withoutCjk.match(/[A-Za-z0-9_]+(?:[-'][A-Za-z0-9_]+)*/g)?.length ?? 0;
  const symbols = withoutCjk.match(/[^\sA-Za-z0-9_]/g)?.length ?? 0;
  return Math.max(1, Math.round(cjk * 1.15 + words / 0.75 + symbols / 3));
}

// UI 标签(「最小装载」等)由前端按 scope id 渲染,不固化进 catalog 数据(ADR 0015)。
function scope(texts: { path: string; text: string }[]): ContextSizeScope {
  const text = texts.map((t) => t.text).join("\n\n");
  return {
    files: texts.map((t) => t.path),
    text_files: texts.length,
    bytes: Buffer.byteLength(text, "utf8"),
    chars: text.length,
    tokens: estimateStaticTokens(text),
  };
}

// rel 作为整体出现、且两侧不是路径/单词字符时才算命中:
// 防止 other-references/x.md 误命中 references/x.md,或 api.mdx 误命中 api.md。
// 后界允许 "."(英文句尾「Read api.md.」)与 "#"(markdown 锚点 api.md#section)。
const EDGE_BEFORE = /[A-Za-z0-9_./-]/;
const EDGE_AFTER = /[A-Za-z0-9_/-]/;

// 入参须已统一小写(大小写不敏感:SKILL.md 写 FORMS.md、盘上是 forms.md 的写法真实存在,
// 在大小写不敏感文件系统上运行时可达)。边界字符类本身对大小写无感,整段在小写副本上判定即可。
function mentioned(hayLower: string, needleLower: string): boolean {
  let i = hayLower.indexOf(needleLower);
  while (i !== -1) {
    const prev = i > 0 ? hayLower[i - 1]! : "";
    const next = hayLower[i + needleLower.length] ?? "";
    if (!(prev && EDGE_BEFORE.test(prev)) && !(next && EDGE_AFTER.test(next))) return true;
    i = hayLower.indexOf(needleLower, i + 1);
  }
  return false;
}

/**
 * 「声明引用」判定:availability 驱动——以包内实际存在的文本文件为候选集,
 * 在 SKILL.md 正文里做边界感知的字面匹配(大小写不敏感),而不是用正则从正文抽路径。
 * 天然支持裸同级文件名(reference.md / FORMS.md)、`./` 前缀与非 ASCII 路径,
 * 且不会命中 URL / 包外路径(候选集里根本没有)。不做语义解析,只认字面提及。
 * license 族文件(LICENSE/NOTICE/COPYING)排除:frontmatter 的许可证声明不是装载资源。
 */
function declaredRefs(skillMd: string, available: Set<string>): string[] {
  const hay = skillMd.toLowerCase();
  const out: string[] = [];
  for (const rel of available) {
    if (rel === "SKILL.md") continue;
    const base = rel.split("/").pop() ?? "";
    if (LICENSE_FILE_RE.test(base)) continue;
    const needle = rel.toLowerCase();
    if (mentioned(hay, needle) || mentioned(hay, "./" + needle)) out.push(rel);
  }
  return out.sort();
}

export async function computeContextSize(args: {
  root: string;
  dirPrefix: string;
  /** 已读出的 SKILL.md 全文(调用方在手,不重复读盘) */
  skillMd: string;
  entries: TreeEntry[];
  generatedAt: string;
}): Promise<ContextSize> {
  const files = args.entries
    .filter((e) => e.type === "blob" && e.path.startsWith(args.dirPrefix))
    .map((e) => e.path.slice(args.dirPrefix.length))
    .filter((p) => p && isTextPath(p))
    .sort();
  const available = new Set(files);

  const realRoot = await realpath(args.root);
  const skillDir = join(args.root, args.dirPrefix);
  const core = [{ path: "SKILL.md", text: args.skillMd }];

  const refs = [];
  for (const rel of declaredRefs(args.skillMd, available)) {
    const text = await readTextFile(realRoot, skillDir, rel);
    if (text !== null) refs.push({ path: rel, text });
  }

  const allText = [];
  for (const rel of files) {
    const text = rel === "SKILL.md" ? args.skillMd : await readTextFile(realRoot, skillDir, rel);
    if (text !== null) allText.push({ path: rel, text });
  }

  return {
    version: "1",
    counter: {
      id: CONTEXT_SIZE_COUNTER_ID,
      method: "heuristic",
      description:
        "静态文本估算: CJK 字符 + 拉丁词 + 符号混合计数;不代表任一模型真实 tokenizer。" +
        `单文本文件 >${MAX_TEXT_FILE_BYTES / 1024}KB 或 symlink 逃逸包外的不计入。`,
    },
    generated_at: args.generatedAt,
    scopes: {
      activation_core: scope(core),
      activation_with_declared_refs: scope([...core, ...refs]),
      package_total_text: scope(allText),
    },
  };
}
