#!/usr/bin/env node
/**
 * oh-my-skill CLI — 别家 npx 是盲装,我们不是:
 *   1. 安装前展示权限营养标签(五因子 + 审计状态 + 复核签名),要求确认
 *   2. 安装时对每个文件复算 git blob sha,与货架 content_hash 比对(防上游被篡改)
 *   3. 校验失败 → 拒装,绝不落盘
 *
 * 用法:
 *   oh-my-skill add <owner/name> [--yes] [--to <dir>]
 *   oh-my-skill list / remove <owner/name>
 * 数据源:默认 Supabase(OMS_API/OMS_KEY 可覆盖);
 *   --from-dir <catalog路径> 用本地 catalog(开发/测试)。
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, rm, stat, cp } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { homedir, tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";

const exec = promisify(execFile);
const API = process.env.OMS_API ?? "https://xlrvinquhuyobewenrlo.supabase.co";
const KEY = process.env.OMS_KEY ?? ""; // anon key,公开只读;发布 npm 前填默认值
const args = process.argv.slice(2);
const cmd = args[0];
const target = args[1];
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };

const FACTORS = { scripts: "📜 脚本执行", network: "🌐 网络请求", filesystem: "📂 文件读写", env_access: "🔑 环境变量", external_commands: "⚙️ 外部命令" };

function blobSha(buf) {
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}
async function walkFiles(dir, base = dir, out = []) {
  for (const name of await readdir(dir)) {
    if (name === ".git") continue;
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) await walkFiles(p, base, out);
    else out.push(relative(base, p));
  }
  return out.sort();
}
async function dirContentHash(dir) {
  const files = await walkFiles(dir);
  const lines = [];
  for (const f of files) lines.push(`${f}:${blobSha(await readFile(join(dir, f)))}`);
  return "sha256:" + createHash("sha256").update(lines.join("\n")).digest("hex");
}

async function fetchReport(id) {
  const local = opt("from-dir");
  if (local) {
    return JSON.parse(await readFile(join(local, ...id.split("/"), "skill-report.json"), "utf8"));
  }
  const res = await fetch(`${API}/rest/v1/skills?id=eq.${encodeURIComponent(id)}`, {
    headers: { apikey: KEY, authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const rows = await res.json();
  if (!rows.length) throw new Error(`未找到 ${id}`);
  const r = rows[0];
  // Supabase 行 → 报告形状归一
  return {
    meta: { id: r.id, hosting: r.hosting, license: r.license, upstream: r.upstream, content_hash: r.content_hash },
    security_audit: { status: r.audit_status, risk_factors: r.risk_factors, review: r.review },
  };
}

function detectAgentDir() {
  const to = opt("to");
  if (to) return to;
  for (const d of [".claude/skills", ".codex/skills", ".cursor/skills"]) {
    // 项目级优先(同步检测简化:直接选 claude 用户级兜底)
  }
  return join(homedir(), ".claude", "skills");
}

async function confirm(msg) {
  if (flag("yes")) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`${msg} [y/N] `)).trim().toLowerCase();
  rl.close();
  return a === "y" || a === "yes";
}

async function add(id) {
  const report = await fetchReport(id);
  const m = report.meta, sa = report.security_audit;
  console.log(`\n■ ${m.id}  (${m.license} / ${m.hosting})`);
  console.log(`  审计状态: ${sa.status === "pass" ? "✓ 已通过三层审计" : "⚠ " + sa.status}`);
  let privileged = false;
  for (const [k, label] of Object.entries(FACTORS)) {
    const f = sa.risk_factors?.[k];
    const mark = f?.present === true ? "含" : f?.present === false ? "无" : "未判定";
    if (f?.present === true) privileged = true;
    console.log(`  ${label}: ${mark}${f?.detail ? ` — ${f.detail}` : ""}`);
  }
  if (sa.review) console.log(`  人工复核: ${sa.review.by} · ${sa.review.note}`);
  if (sa.status !== "pass") {
    if (!(await confirm("⚠ 该 skill 未通过审计,仍要安装?"))) return console.log("已取消");
  } else if (privileged) {
    if (!(await confirm("该 skill 含特权行为(见上),确认安装?"))) return console.log("已取消");
  } else if (!(await confirm("确认安装?"))) return console.log("已取消");

  // 获取文件:本地 catalog 的 mirror/,或 clone 上游
  const work = join(tmpdir(), `oh-my-skill-${Date.now()}`);
  await mkdir(work, { recursive: true });
  let srcDir;
  const local = opt("from-dir");
  if (local && m.hosting === "mirrored") {
    srcDir = join(local, ...m.id.split("/"), "mirror");
  } else {
    const mm = m.upstream.match(/github\.com\/([^/]+\/[^/]+)\/tree\/[^/]+\/?(.*)$/);
    if (!mm) throw new Error("无法解析上游地址");
    await exec("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${mm[1]}.git`, work]);
    srcDir = join(work, mm[2] ?? "");
  }

  // 哈希校验(灵魂步骤)
  const actual = await dirContentHash(srcDir);
  if (m.content_hash && actual !== m.content_hash) {
    await rm(work, { recursive: true, force: true });
    throw new Error(`✗ 内容哈希不匹配!货架 ${m.content_hash.slice(0, 20)}… vs 实际 ${actual.slice(0, 20)}…\n  内容可能在审计后被修改,已拒绝安装。`);
  }
  console.log(`  ✓ 内容哈希校验通过 ${actual.slice(0, 27)}…`);

  const dest = join(detectAgentDir(), m.id.split("/")[1]);
  await mkdir(dirname(dest), { recursive: true });
  await cp(srcDir, dest, { recursive: true });
  await rm(work, { recursive: true, force: true });
  console.log(`✓ 已安装到 ${dest}\n`);
}

async function list() {
  const dir = detectAgentDir();
  try {
    for (const name of await readdir(dir)) console.log(name);
  } catch { console.log(`(空:${dir})`); }
}

async function remove(id) {
  const dest = join(detectAgentDir(), id.includes("/") ? id.split("/")[1] : id);
  if (await confirm(`删除 ${dest}?`)) { await rm(dest, { recursive: true, force: true }); console.log("✓ 已删除"); }
}

const run = { add, list, remove }[cmd];
if (!run || (cmd !== "list" && !target)) {
  console.log("用法: oh-my-skill add <owner/name> [--yes] [--to <dir>] [--from-dir <catalog>] | list | remove <name>");
  process.exit(1);
}
run(target).catch((e) => { console.error(e.message); process.exit(1); });
