/**
 * Mock runner:不接真实 agent,按任务与条件生成模拟产物,用于端到端跑通评测管线。
 * - with_skill  → 生成合格的 OOXML(有样式/TOC/公式)→ 校验高分
 * - without_skill → 生成劣质产物(纯文本冒充 .docx / 无公式的表)→ 校验低分
 * 真实 runner 换掉本文件即可,其余管线不动。
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { zip } from "../ooxml.ts";
import type { EvalRunner } from "../types.ts";

const CT_DOCX = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
const RELS = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

/** 由 skillId 派生的确定性质量值 0.55–1.00(mock 用,制造横评梯度) */
function quality(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 0.55 + (h % 46) / 100;
}

function goodDocx(q: number): Buffer {
  const toc = q >= 0.8
    ? `<w:sdt><w:sdtContent><w:p><w:r><w:instrText>TOC \\o "1-2"</w:instrText></w:r></w:p><w:p><w:r><w:t>目录</w:t></w:r></w:p></w:sdtContent></w:sdt>` : "";
  const h2 = (t: string) => q >= 0.7
    ? `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${t}</w:t></w:r></w:p>`
    : `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
  const body = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${toc}
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>季度业务回顾</w:t></w:r></w:p>
${h2("收入概况")}<w:p><w:r><w:t>本季度总收入增长,由订阅业务驱动。</w:t></w:r></w:p>
${h2("成本结构")}${h2("下季度展望")}</w:body></w:document>`;
  return zip([{ name: "[Content_Types].xml", data: CT_DOCX }, { name: "_rels/.rels", data: RELS }, { name: "word/document.xml", data: body }]);
}

const CT_XLSX = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`;
const XLSX_RELS = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
const WB = `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets></workbook>`;

function goodXlsx(q: number): Buffer {
  // q 低:合计写死数字而非公式;q 更低:合计值也算错
  const totalCell = q >= 0.65 ? `<f>SUM(B1:B3)</f><v>68000</v>` : q >= 0.85 ? `<v>68000</v>` : `<v>68000</v>`;
  const sheet = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>市场</t></is></c><c r="B1"><v>12000</v></c></row>
<row r="2"><c r="A2" t="inlineStr"><is><t>研发</t></is></c><c r="B2"><v>35000</v></c></row>
<row r="3"><c r="A3" t="inlineStr"><is><t>销售</t></is></c><c r="B3"><v>21000</v></c></row>
<row r="4"><c r="A4" t="inlineStr"><is><t>合计</t></is></c><c r="B4">${totalCell}</c></row>
</sheetData></worksheet>`;
  return zip([{ name: "[Content_Types].xml", data: CT_XLSX }, { name: "_rels/.rels", data: XLSX_RELS }, { name: "xl/workbook.xml", data: WB }, { name: "xl/worksheets/sheet1.xml", data: sheet }]);
}

export const mockRunner: EvalRunner = {
  name: "mock-v1",
  async run({ skillId, task, workDir, condition }) {
    await mkdir(workDir, { recursive: true });
    const artifactPath = join(workDir, task.artifact);

    if (condition === "without_skill") {
      // 无 skill:agent 直接堆文字冒充文档 → 非法 OOXML → 校验基本 fail
      await writeFile(artifactPath, `季度业务回顾\n收入概况\n成本结构\n下季度展望\n(纯文本,无版式)`);
      return { artifactPath };
    }
    const q = quality(skillId);
    const data = task.artifact.endsWith(".xlsx") ? goodXlsx(q) : goodDocx(q);
    await writeFile(artifactPath, data);
    return { artifactPath };
  },
};
