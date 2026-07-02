/** 确定性校验:打开 output.docx,检查它是不是一个带 TOC 与标题样式的合法文档 */
import { readFile } from "node:fs/promises";
import { unzip, entryText } from "../../../ooxml.ts";
import type { Check } from "../../../types.ts";

export default async function verify(artifactPath: string): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (id: string, pass: boolean, weight: number, note?: string) =>
    checks.push({ id, pass, weight, note });

  let pkg: Map<string, Buffer> | null = null;
  try {
    pkg = unzip(await readFile(artifactPath));
  } catch {
    add("valid-docx", false, 3, "无法作为 docx 解压——产物不是合法 Word 文档");
    return checks; // 连文件都不合法,后续检查无意义
  }

  // 1. 是合法 OOXML 包(有 content types + document.xml)
  const hasCT = pkg.has("[Content_Types].xml");
  const doc = entryText(pkg, "word/document.xml");
  add("valid-docx", hasCT && doc.length > 0, 3, "含 [Content_Types].xml 与 word/document.xml");
  if (!doc) return checks;

  // 2. 使用了标题样式(Heading1/Heading2)
  const hasH1 = /w:pStyle[^>]*w:val="Heading1"/.test(doc) || /w:pStyle[^>]*w:val="1"/.test(doc);
  const hasH2 = /w:pStyle[^>]*w:val="Heading2"/.test(doc) || /w:pStyle[^>]*w:val="2"/.test(doc);
  add("heading-1", hasH1, 2, "正文使用 Heading 1 样式");
  add("heading-2", hasH2, 1, "正文使用 Heading 2 样式");

  // 3. 含目录(TOC 字段:instrText 里的 TOC,或 SDC 目录容器)
  const hasToc = /TOC\b/.test(doc) || doc.includes("w:sdtContent") && /目录|Table of Contents/i.test(doc);
  add("has-toc", hasToc, 2, "包含自动生成的目录字段");

  // 4. 正文内容完整(保留了原文关键词)
  const keptContent = ["收入", "成本", "展望", "订阅"].filter((k) => doc.includes(k)).length;
  add("content-preserved", keptContent >= 3, 2, `保留原文关键内容(命中 ${keptContent}/4)`);

  return checks;
}
