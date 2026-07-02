/** 确定性校验:打开 output.xlsx,检查数据完整且用了 SUM 公式(而非写死数字) */
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
    add("valid-xlsx", false, 3, "无法作为 xlsx 解压——产物不是合法 Excel 文档");
    return checks;
  }

  const hasWb = pkg.has("xl/workbook.xml");
  // 找第一张表
  let sheet = "";
  for (const [name, buf] of pkg) {
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) { sheet = buf.toString("utf8"); break; }
  }
  add("valid-xlsx", hasWb && sheet.length > 0, 3, "含 workbook.xml 与至少一张工作表");
  if (!sheet) return checks;

  // 数据完整:三个部门 + 金额都在(值可能在 sharedStrings)
  const shared = entryText(pkg, "xl/sharedStrings.xml");
  const blob = sheet + shared;
  const depts = ["市场", "研发", "销售"].filter((d) => blob.includes(d)).length;
  add("data-preserved", depts >= 3, 2, `保留全部数据行(命中部门 ${depts}/3)`);

  // 用了 SUM 公式:sheet xml 里有 <f>SUM(...)</f>
  const hasSumFormula = /<f[^>]*>\s*SUM\s*\(/i.test(sheet);
  add("sum-formula", hasSumFormula, 3, "合计用 SUM 公式(而非写死数字)");

  // 合计值正确(68000)出现在某处,作为加分项
  add("total-correct", blob.includes("68000"), 1, "合计值 68000 正确");

  return checks;
}
