#!/usr/bin/env node
/**
 * oh-my-skill CLI — 别家 npx 是盲装,我们不是:
 *   1. 安装时对每个文件复算 git blob sha,与货架 content_hash 比对(防上游被篡改)
 *   2. 校验失败 → 拒装,绝不落盘
 *
 * 用法:
 *   oh-my-skill add <owner/repo/name> [--yes] [--to <dir>]
 *   oh-my-skill list / remove <owner/repo/name>
 * 数据源:默认 Supabase(OMS_API/OMS_KEY 可覆盖);
 *   --from-dir <catalog路径> 用本地 catalog(开发/测试)。
 */
import { createHash, randomUUID } from "node:crypto";
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
/** 取值型 flag(其后跟一个值),解析多目标位置参数时要跳过它们的值 */
const VALUE_FLAGS = new Set(["--to", "--from-dir", "--t"]);

/**
 * 匿名装机回执(ADR 0017 砖一)——「从本店安装」的获取渠道留痕,不是使用追踪:
 * 只发 skill id / 货架哈希 / 匿名机器 id / 网页复制命令内嵌的短 token(--t,用于绑定网页会话)。
 * 首跑生成 machine-id 并明示;OMS_TELEMETRY=0 关闭;失败静默,绝不影响安装。
 */
async function machineId() {
  const file = join(homedir(), ".oh-my-skill", "machine-id");
  try { return (await readFile(file, "utf8")).trim(); } catch { /* 首跑,生成 */ }
  const id = randomUUID();
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, id + "\n");
  console.log("ℹ 首次使用:已生成匿名安装计数 id(~/.oh-my-skill/machine-id,不含个人信息);OMS_TELEMETRY=0 可关闭上报");
  return id;
}
async function postReceipt(skillId, channel, contentHash) {
  if (process.env.OMS_TELEMETRY === "0" || !KEY || opt("from-dir")) return;
  try {
    await fetch(`${API}/rest/v1/install_receipts`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({
        skill_id: skillId,
        content_hash: contentHash ?? null,
        channel,
        machine_id: await machineId(),
        token: opt("t") ?? null,
        cli_version: CLI_VERSION,
      }),
    });
  } catch { /* 回执失败绝不影响安装 */ }
}
const CLI_VERSION = await readFile(new URL("../package.json", import.meta.url), "utf8")
  .then((s) => JSON.parse(s).version).catch(() => "0.0.0");
/** add 支持多目标:oh-my-skill add a b c(场景包页的「全装一套」命令) */
function targets() {
  const out = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) { if (VALUE_FLAGS.has(args[i])) i++; continue; }
    out.push(args[i]);
  }
  return out;
}

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
  };
}

/**
 * 插拔点③(ADR 0012 步骤④):装前信任披露,verdict 有则显示、没有就跳过。
 * TRUST_DISPLAY=1 才读;S0 只支持 --from-dir(账本在 catalog/verdicts);S1 起 API 行携带 verdict。
 * content_hash 完整性校验与本函数无关,永远在。
 */
async function loadVerdict(id, contentHash) {
  if (process.env.TRUST_DISPLAY !== "1") return null;
  const local = opt("from-dir");
  if (!local) return null;
  try {
    const ledger = JSON.parse(await readFile(join(local, "..", "verdicts", ...id.split("/")) + ".json", "utf8"));
    const v = ledger.verdicts?.[0];
    // 判定锚内容:hash 不符不展示(内容已变,旧判定不作数)
    return v && v.subject?.content_hash === contentHash ? v : null;
  } catch { return null; }
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
  const m = report.meta;
  console.log(`\n■ ${m.id}  (${m.license} / ${m.hosting})`);
  const v = await loadVerdict(id, m.content_hash);
  if (v) {
    console.log(`  判定: ${v.status}(policy ${v.scanner?.policy})—— 披露非背书`);
    for (const [k, f] of Object.entries(v.factors ?? {})) {
      console.log(`    ${k}: ${f.present === true ? "含" : f.present === false ? "无" : "未判定"}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }
  if (!(await confirm("确认安装?"))) return console.log("已取消");

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
    throw new Error(`✗ 内容哈希不匹配!货架 ${m.content_hash.slice(0, 20)}… vs 实际 ${actual.slice(0, 20)}…\n  内容可能在收录后被修改,已拒绝安装。`);
  }
  console.log(`  ✓ 内容哈希校验通过 ${actual.slice(0, 27)}…`);

  const dest = join(detectAgentDir(), m.id.split("/").at(-1)); // 落盘目录名 = id 最后一段(skill 名)
  await mkdir(dirname(dest), { recursive: true });
  await cp(srcDir, dest, { recursive: true });
  await rm(work, { recursive: true, force: true });
  console.log(`✓ 已安装到 ${dest}\n`);
  await postReceipt(m.id, "cli", m.content_hash); // 装成才留痕;3s 超时,失败静默
}

/**
 * verify:不重装,验证本机已装副本(ADR 0017 路径③——存量用户的主通道:
 * 早期用户多已通过别的渠道装过,没必要为了身份再装一次)。
 * 语义红线:verify 只证明「本机确有此物」,不证明来源——回执 channel=verify,
 * 徽章措辞对应「已验证本机安装」,与 download/cli 的「从本店安装」分档。
 *   oh-my-skill verify <owner/repo/name> [--to <dir>] [--t <码>]
 *   oh-my-skill verify --all          扫描本地全部已装 skill,逐个与货架比对(顺带当 outdated 用)
 */
function agentDirs() {
  const to = opt("to");
  if (to) return [to];
  return [".claude", ".codex", ".cursor"].map((d) => join(homedir(), d, "skills"));
}
async function findLocal(leaf) {
  for (const d of agentDirs()) {
    try { if ((await stat(join(d, leaf))).isDirectory()) return join(d, leaf); } catch { /* 该目录无此 skill */ }
  }
  return null;
}
async function verifyOne(id, { quiet = false } = {}) {
  const report = await fetchReport(id);
  const m = report.meta;
  const leaf = m.id.split("/").at(-1);
  const local = await findLocal(leaf);
  if (!local) {
    if (!quiet) console.log(`✗ 本机未找到 ${leaf}(查过 ${agentDirs().join(" / ")};装在别处用 --to 指路径)`);
    return false;
  }
  const actual = await dirContentHash(local);
  const match = m.content_hash && actual === m.content_hash;
  console.log(match
    ? `✓ ${m.id} — 本机副本与货架一致 ${actual.slice(0, 27)}…`
    : `△ ${m.id} — 本机副本与货架不同(旧版本或已自行修改);按实际内容留痕`);
  await postReceipt(m.id, "verify", actual); // 回执记「实际持有」的哈希,评价侧据此显示「评于版本」
  return true;
}
async function verifyAll() {
  let seen = 0, verified = 0;
  for (const d of agentDirs()) {
    let names = [];
    try { names = await readdir(d); } catch { continue; }
    for (const leaf of names) {
      try { if (!(await stat(join(d, leaf))).isDirectory()) continue; } catch { continue; }
      seen++;
      // 本地目录名 → 货架 id:按 name 查,唯一命中才自动验证;多义留给用户手动 verify <完整id>
      try {
        const res = await fetch(`${API}/rest/v1/skills?name=eq.${encodeURIComponent(leaf)}&select=id`, {
          headers: { apikey: KEY, authorization: `Bearer ${KEY}` },
        });
        const rows = res.ok ? await res.json() : [];
        if (rows.length === 1) { if (await verifyOne(rows[0].id, { quiet: true })) verified++; }
        else if (rows.length > 1) console.log(`? ${leaf} — 货架有 ${rows.length} 个同名,手动指定:oh-my-skill verify <owner/repo/${leaf}>`);
        else console.log(`- ${leaf} — 货架未收录`);
      } catch { /* 单个失败继续 */ }
    }
  }
  console.log(`\n扫描 ${seen} 个本地 skill,完成验证 ${verified} 个`);
}

async function list() {
  const dir = detectAgentDir();
  try {
    for (const name of await readdir(dir)) console.log(name);
  } catch { console.log(`(空:${dir})`); }
}

async function remove(id) {
  const dest = join(detectAgentDir(), id.includes("/") ? id.split("/").at(-1) : id);
  if (await confirm(`删除 ${dest}?`)) { await rm(dest, { recursive: true, force: true }); console.log("✓ 已删除"); }
}

const run = { add, list, remove, verify: verifyOne }[cmd];
if (!run || (cmd !== "list" && !target && !(cmd === "verify" && flag("all")))) {
  console.log("用法: oh-my-skill add <owner/repo/name>… [--yes] [--to <dir>] [--from-dir <catalog>]");
  console.log("      oh-my-skill verify <owner/repo/name> | verify --all   已装过?验证本机副本,不重装");
  console.log("      oh-my-skill list | remove <name>");
  process.exit(1);
}
(async () => {
  if (cmd === "add") {
    // 多目标顺序安装(场景包「装整套」);每个仍走完整的确认→哈希校验流程
    const ids = targets();
    for (const id of ids) await add(id);
    if (ids.length > 1) console.log(`\n✓ 一套装齐:${ids.length} 个 skill 处理完毕`);
  } else if (cmd === "verify") {
    if (flag("all")) await verifyAll();
    else for (const id of targets()) await verifyOne(id);
  } else {
    await run(target);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
