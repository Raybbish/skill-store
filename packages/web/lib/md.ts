/**
 * SKILL.md 原文的最小安全渲染(ADR 0025「怎么用」板块的原文折叠)。
 *
 * 刻意不引 markdown 依赖:上游正文是**不可信输入**,先整体 HTML 转义,再只注入
 * 我们自己的标签——支持标题/段落/列表/围栏代码/行内代码/粗斜体/引用/分隔线/绝对链接。
 * 不支持的语法(表格、HTML 块、图片、相对链接)按纯文本原样显示——诚实降级,
 * 不渲染 ≠ 不展示。图片与相对链接脱离仓库上下文本就是死的(设计稿「渲染残废」一节),
 * 想看完整渲染去上游(板块给「在 GitHub 查看」出口)。
 *
 * 仅构建期(SSG)在服务端调用;输出经 dangerouslySetInnerHTML 注入,
 * 安全性由「先转义、后注入受控标签」保证,链接只放行 http(s) 且一律 rel=noopener。
 */

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ESC[c]);

/** 去 YAML frontmatter(name/description 已结构化进 meta,原文区不重复展示) */
export function stripFrontmatter(md: string): string {
  const m = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? md.slice(m[0].length) : md;
}

/** 行内格式:输入已转义;只处理行内代码 / 粗体 / 斜体 / 绝对链接 */
function inline(s: string): string {
  // 行内代码先行(内部不再处理其他格式):占位隔离,避免代码里的 * _ 被误判
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c: string) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  // [text](url):仅绝对 http(s);其余(相对路径、锚点)保持纯文本
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)] ?? "");
}

/** 极简 markdown → HTML(块级状态机;输入不可信,先整体转义) */
export function renderMarkdown(md: string): string {
  const lines = esc(md.replace(/\r\n/g, "\n")).split("\n");
  const out: string[] = [];
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // 围栏代码块(``` 或 ~~~;语言标注忽略)
    const fence = line.match(/^(```|~~~)/);
    if (fence) {
      flush();
      const closer = fence[1];
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(closer)) buf.push(lines[i++]);
      i++; // 吃掉闭栏(或到 EOF)
      out.push(`<pre>${buf.join("\n")}</pre>`);
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      const lv = Math.min(h[1].length + 3, 6); // h1→h4 起步:原文是折叠区内容,不与页面标题抢层级
      out.push(`<h${lv}>${inline(h[2])}</h${lv}>`);
      i++;
      continue;
    }

    // 分隔线
    if (/^(\s*)(---+|\*\*\*+|___+)\s*$/.test(line)) {
      flush();
      out.push("<hr/>");
      i++;
      continue;
    }

    // 引用块(连续 > 行合并)
    if (/^\s*&gt;/.test(line)) {
      flush();
      const buf: string[] = [];
      while (i < lines.length && /^\s*&gt;/.test(lines[i])) buf.push(lines[i++].replace(/^\s*&gt;\s?/, ""));
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // 列表(- * + / 数字.;嵌套按缩进两档,再深并入上一档)
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      flush();
      const ordered = /^\s*\d+\./.test(line);
      const tag = ordered ? "ol" : "ul";
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        const raw = lines[i];
        const indent = (raw.match(/^\s*/) ?? [""])[0].length;
        const text = raw.replace(/^\s*([-*+]|\d+\.)\s+/, "");
        items.push(indent >= 2 ? `<li class="sub">${inline(text)}</li>` : `<li>${inline(text)}</li>`);
        i++;
        // 续行(缩进的普通文本并入上一项)
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, ` ${inline(lines[i].trim())}</li>`);
          i++;
        }
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // 空行 = 段落边界
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}
