#!/usr/bin/env node
// 从 catalog + git 派生项目状态 —— 这些数字别手写。
// 用法: node scripts/status.mjs  (或 npm run status)
// 产出: docs/STATUS.generated.md  +  docs/STATUS.html(#3b6cf0 面板,给人看)
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(root, "catalog", "skills");

function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name === "skill-report.json") out.push(p);
  }
  return out;
}

const reports = walk(CATALOG);
const status = {}, hosting = {};
let evaluated = 0;
const publishers = new Set();
for (const f of reports) {
  try {
    const r = JSON.parse(readFileSync(f, "utf8"));
    const st = r.security_audit?.status ?? "pending";
    status[st] = (status[st] ?? 0) + 1;
    const h = r.meta?.hosting ?? "unknown";
    hosting[h] = (hosting[h] ?? 0) + 1;
    if (r.eval) evaluated++;
    if (r.meta?.publisher) publishers.add(r.meta.publisher);
  } catch { /* skip malformed */ }
}

// --no-optional-locks:只读查询绝不写 .git/index(避免在只读/受限文件系统里留下 index.lock)
const git = (cmd, fb = "") => { try { return execSync(`git --no-optional-locks ${cmd}`, { cwd: root, encoding: "utf8" }).trim(); } catch { return fb; } };
const branch = git("rev-parse --abbrev-ref HEAD", "?");
const log = git("log --oneline -8", "(no git history)");
const dirty = git("status --short").split("\n").filter(Boolean).length;

const total = reports.length;
const passed = status.pass ?? 0;
const pct = total ? Math.round((passed * 100) / total) : 0;
const now = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
const kv = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(" · ") || "—";

/* ---------- 1) markdown 快照(仓内事实源) ---------- */
const md = `<!-- 自动生成,勿手改。运行: npm run status -->
# 项目状态(自动快照)

_生成于 ${now} · 分支 \`${branch}\`${dirty ? ` · 未提交改动 ${dirty} 处` : " · 工作区干净"}_

## Catalog
- **skill 总数:${total}**
- 审计状态(⛔ 扫描已下架,ADR 0011;此为历史数据):${kv(status)}  →  通过 **${passed} / ${pct}%**
- 托管:${kv(hosting)}
- 已评测:**${evaluated}** · 发布者:**${publishers.size}**

## 最近提交
\`\`\`
${log}
\`\`\`
`;

/* ---------- 2) HTML 面板(给人看,渲染 STATUS.md + 实时数字) ---------- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

// 极简 markdown → HTML(覆盖 STATUS.md 用到的子集:标题/列表/引用/围栏代码)
function mdToHtml(src) {
  const out = [];
  let inList = false, inCode = false, code = [];
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of src.split("\n")) {
    if (raw.trim().startsWith("```")) {
      if (inCode) { out.push(`<pre>${esc(code.join("\n"))}</pre>`); code = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { code.push(raw); continue; }
    if (/^###\s+/.test(raw)) { closeList(); out.push(`<h3>${inline(raw.replace(/^###\s+/, ""))}</h3>`); }
    else if (/^##\s+/.test(raw)) { closeList(); out.push(`<h2>${inline(raw.replace(/^##\s+/, ""))}</h2>`); }
    else if (/^#\s+/.test(raw)) { closeList(); out.push(`<h1>${inline(raw.replace(/^#\s+/, ""))}</h1>`); }
    else if (/^>\s?/.test(raw)) { closeList(); out.push(`<blockquote>${inline(raw.replace(/^>\s?/, ""))}</blockquote>`); }
    else if (/^[-*]\s+/.test(raw)) { if (!inList) { out.push("<ul>"); inList = true; } out.push(`<li>${inline(raw.replace(/^[-*]\s+/, ""))}</li>`); }
    else if (raw.trim() === "") { closeList(); }
    else { closeList(); out.push(`<p>${inline(raw)}</p>`); }
  }
  closeList();
  if (inCode) out.push(`<pre>${esc(code.join("\n"))}</pre>`);
  return out.join("\n");
}

const statusMdPath = join(root, "docs", "STATUS.md");
const statusBody = existsSync(statusMdPath) ? mdToHtml(readFileSync(statusMdPath, "utf8")) : "<p>(缺 docs/STATUS.md)</p>";

const card = (big, label, tone = "") => `<div class="card"><b class="${tone}">${big}</b><span>${label}</span></div>`;
const cards = [
  card(total, "skill 总数"),
  card(`${passed}<i>/${pct}%</i>`, "审计通过(已下架·历史)", "ok"),
  card(kv(hosting).replace(/·/g, "<i>·</i>"), "托管"),
  card(status.needs_review ?? 0, "待复核", (status.needs_review ?? 0) ? "warn" : ""),
  card(evaluated, "已评测"),
  card(publishers.size, "发布者"),
].join("");

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>oh-my-skill · 项目状态</title>
<style>
:root{--bg:#f5f5f7;--card:#fff;--ink:#1d1d1f;--sub:#6e6e73;--faint:#86868b;--line:#e6e6ea;--accent:#3b6cf0;--accent-soft:#edf2fe;--ok:#2e9e5b;--warn:#c77b12}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.62;font-size:15px}
.wrap{max-width:900px;margin:0 auto;padding:36px 24px 80px}
header{background:linear-gradient(135deg,#eef2fb,#f7f9fe);border:1px solid var(--line);border-radius:18px;padding:26px 28px;margin-bottom:20px}
header .e{color:var(--accent);font-weight:600;font-size:13px;letter-spacing:.02em}
header h1{font-size:25px;margin:6px 0 6px;letter-spacing:-.01em}
header .m{color:var(--sub);font-size:13px;font-family:ui-monospace,Menlo,monospace}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:22px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 12px;text-align:center}
.card b{display:block;font-size:20px;font-weight:700;letter-spacing:-.01em}
.card b i{font-style:normal;font-size:12px;color:var(--faint);font-weight:600}
.card b.ok{color:var(--ok)}.card b.warn{color:var(--warn)}
.card span{font-size:11px;color:var(--faint)}
.doc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px 30px}
.doc h1{font-size:22px;margin:2px 0 4px}
.doc h2{font-size:18px;margin:26px 0 10px;padding-top:16px;border-top:1px solid var(--line);letter-spacing:-.01em}
.doc h2:first-of-type{border-top:none;padding-top:0}
.doc h3{font-size:15px;margin:16px 0 6px;color:#2b3a63}
.doc p{margin:8px 0;color:var(--sub)}
.doc ul{margin:8px 0 8px 2px;list-style:none}
.doc li{position:relative;padding:5px 0 5px 20px;color:var(--sub);font-size:14px}
.doc li:before{content:"›";position:absolute;left:2px;color:var(--accent);font-weight:700}
.doc strong{color:var(--ink);font-weight:600}
.doc a{color:var(--accent)}
.doc blockquote{color:var(--faint);font-size:12.5px;border-left:2px solid var(--line);padding:4px 0 4px 12px;margin:8px 0}
.doc code{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;background:#f0f0f3;border:1px solid var(--line);border-radius:5px;padding:1px 5px}
.doc pre{background:#14181f;color:#c9d4e6;border-radius:12px;padding:14px 16px;overflow-x:auto;font-family:ui-monospace,Menlo,monospace;font-size:12px;line-height:1.7;margin:10px 0}
footer{margin-top:22px;color:var(--faint);font-size:12px;text-align:center;font-family:ui-monospace,Menlo,monospace}
@media(max-width:680px){.grid{grid-template-columns:repeat(2,1fr)}}
</style></head><body><div class="wrap">
<header>
  <div class="e">OH-MY-SKILL · 项目状态面板</div>
  <h1>我们在哪</h1>
  <div class="m">生成于 ${now} · 分支 ${esc(branch)}${dirty ? ` · 未提交 ${dirty} 处` : " · 工作区干净"}</div>
</header>
<div class="grid">${cards}</div>
<div class="doc">
  <h2>最近提交</h2>
  <pre>${esc(log)}</pre>
  ${statusBody}
</div>
<footer>本页由 npm run status(scripts/status.mjs)自动生成 · 事实源:docs/STATUS.md + catalog + git · 勿手改</footer>
</div></body></html>`;

/* ---------- 写盘 ---------- */
const outDir = join(root, "docs");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "STATUS.generated.md"), md);
writeFileSync(join(outDir, "STATUS.html"), html);
process.stdout.write(`skill ${total} · 通过 ${passed}/${pct}% · 待复核 ${status.needs_review ?? 0} · 未提交 ${dirty}\n→ docs/STATUS.generated.md + docs/STATUS.html\n`);
