/** 确定性校验:打开 output.pptx,检查分页数量与标题结构 */
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
    add("valid-pptx", false, 3, "无法作为 pptx 解压——产物不是合法 PowerPoint");
    return checks;
  }

  const hasPres = pkg.has("ppt/presentation.xml");
  const slides = [...pkg.keys()].filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
  add("valid-pptx", hasPres && slides.length > 0, 3, "含 presentation.xml 与至少一张幻灯片");
  if (!slides.length) return checks;

  // 标题页 + 3 个内容页 = 至少 4 页(或 >=3 给部分分)
  add("slide-count", slides.length >= 4, 3, `分页数量达标(${slides.length} 页,期望 ≥4)`);

  // 标题占位符(标题页)
  const allSlides = slides.map((k) => entryText(pkg!, k)).join("");
  const hasTitle = /p:ph[^>]*type="(ctrTitle|title)"/.test(allSlides);
  add("title-slide", hasTitle, 2, "含标题页占位符");

  // 内容保留
  const kept = ["市场机会", "产品定位", "增长路径"].filter((k) => allSlides.includes(k)).length;
  add("content-preserved", kept >= 3, 2, `保留提纲各节(命中 ${kept}/3)`);

  return checks;
}
