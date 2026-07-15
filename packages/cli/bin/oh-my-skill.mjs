#!/usr/bin/env node
/**
 * oh-my-skill CLI — 别家 npx 是盲装,我们不是:
 *   1. 安装时对每个文件复算 git blob sha,与货架 content_hash 比对(防上游被篡改)
 *   2. 校验失败 → 拒装,绝不落盘
 *
 * 用法:
 *   oh-my-skill add <owner/repo/name> [--agent <id>] [--scope user|project] [--yes] [--to <dir>]
 *   oh-my-skill list / remove <owner/repo/name>
 * 数据源:默认 Supabase(OMS_API/OMS_KEY 可覆盖);
 *   --from-dir <catalog路径> 用本地 catalog(开发/测试)。
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, rm, stat, cp, rename } from "node:fs/promises";
import { join, dirname, relative, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";

const exec = promisify(execFile);
const API = process.env.OMS_API ?? "https://xlrvinquhuyobewenrlo.supabase.co";
// anon key 是公开设计的密钥(前端 bundle 同款):只读货架 + 只插回执,RLS 把门。默认内置,OMS_KEY 可覆盖。
const KEY = process.env.OMS_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhscnZpbnF1aHV5b2Jld2VucmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NjAyNDEsImV4cCI6MjA5ODUzNjI0MX0.hGZ9NznFZ0Roi2RyIJ-1PVtqr3EVFMfN_9Lovu-SDR8";
const args = process.argv.slice(2);
const cmd = args[0];
const target = args[1];
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
/** 取值型 flag(其后跟一个值),解析多目标位置参数时要跳过它们的值 */
const VALUE_FLAGS = new Set(["--to", "--from-dir", "--t", "--agent", "--scope", "--project-root"]);

class CliError extends Error {
  constructor(exitCode, message) {
    super(message);
    this.exitCode = exitCode;
  }
}

const AGENT_SPECS = {
  claude: { dir: ".claude" },
  codex: { dir: ".codex" },
  cursor: { dir: ".cursor" },
  qwen: { dir: ".qwen" },
  kimi: { dir: ".kimi-code", envHome: "KIMI_CODE_HOME" },
  comate: { dir: ".comate" },
  codebuddy: { dir: ".codebuddy" },
  iflow: { dir: ".iflow" },
};

async function pathExists(path) {
  try { await stat(path); return true; } catch { return false; }
}

function requireSourceHash(meta) {
  const hash = meta?.content_hash;
  if (typeof hash !== "string" || !/^sha256:[0-9a-f]{64}$/i.test(hash)) {
    throw new CliError(4, "✗ 货架 content_hash 缺失或格式非法,已在下载和写盘前拒绝安装。请等待货架重新同步;不能用 --force 绕过。");
  }
  return hash;
}

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
    if (name === "LICENSE.upstream") continue; // 本店注入的仓级证(保留名),不属上游内容,不参与哈希
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
    try {
      return JSON.parse(await readFile(join(local, ...id.split("/"), "skill-report.json"), "utf8"));
    } catch (error) {
      throw new CliError(3, `读取本地货架失败:${error.message}`);
    }
  }
  try {
    const fields = "id,name,hosting,mirror_complete,license,upstream,upstream_commit,content_hash,delisted_at";
    const res = await fetch(`${API}/rest/v1/skills?id=eq.${encodeURIComponent(id)}&select=${fields}`, {
      headers: { apikey: KEY, authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const rows = await res.json();
    if (!rows.length) throw new Error(`未找到 ${id}`);
    const r = rows[0];
    // Supabase 行 → 报告形状归一;安装所需字段不得在这一层丢失。
    return {
      meta: {
        id: r.id,
        name: r.name,
        hosting: r.hosting,
        mirror_complete: r.mirror_complete,
        license: r.license,
        upstream: r.upstream,
        upstream_commit: r.upstream_commit,
        content_hash: r.content_hash,
        delisted_at: r.delisted_at,
      },
    };
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(3, `货架查询失败:${error.message}`);
  }
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

async function projectRoot() {
  const explicit = opt("project-root");
  if (explicit) return resolve(explicit);
  let current = resolve(process.cwd());
  while (true) {
    if (await pathExists(join(current, ".git"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(process.cwd());
    current = parent;
  }
}

async function agentDir(agentId, scope) {
  const spec = AGENT_SPECS[agentId];
  if (!spec) {
    throw new CliError(2, `未知 Agent: ${agentId}。可选:${Object.keys(AGENT_SPECS).join(", ")}`);
  }
  if (scope === "project") return join(await projectRoot(), spec.dir, "skills");
  const userBase = spec.envHome && process.env[spec.envHome]
    ? resolve(process.env[spec.envHome])
    : join(homedir(), spec.dir);
  return join(userBase, "skills");
}

async function detectAgentDir() {
  const to = opt("to");
  if (to) return resolve(to);

  const requestedAgent = opt("agent");
  const requestedScope = opt("scope");
  if (requestedScope && !["user", "project"].includes(requestedScope)) {
    throw new CliError(2, `未知 scope: ${requestedScope}。可选:user, project`);
  }
  if (requestedAgent === "all") {
    throw new CliError(2, "--agent all 将在多目标事务阶段开放;当前请逐个指定 --agent。");
  }
  if (requestedAgent) {
    if (requestedScope) return agentDir(requestedAgent, requestedScope);
    const project = await agentDir(requestedAgent, "project");
    return (await pathExists(project)) ? project : agentDir(requestedAgent, "user");
  }

  const scopes = requestedScope ? [requestedScope] : ["project", "user"];
  const matches = [];
  for (const agentId of Object.keys(AGENT_SPECS)) {
    for (const scope of scopes) {
      const dir = await agentDir(agentId, scope);
      if (await pathExists(dir)) matches.push({ agentId, scope, dir });
    }
  }
  const unique = [...new Map(matches.map((m) => [m.dir, m])).values()];
  if (unique.length === 1) return unique[0].dir;
  if (unique.length === 0) {
    throw new CliError(2, "未探测到唯一 Agent 目录。请显式传 --agent <id> [--scope user|project],或用 --to <dir>。");
  }
  throw new CliError(2, `探测到多个 Agent 目录:${unique.map((m) => `${m.agentId}/${m.scope}`).join(", ")}。请显式传 --agent 和 --scope。`);
}

async function confirm(msg) {
  if (flag("yes")) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`${msg} [y/N] `)).trim().toLowerCase();
  rl.close();
  return a === "y" || a === "yes";
}

function pinnedGitHubSource(meta) {
  if (typeof meta?.upstream_commit !== "string" || !/^[0-9a-f]{40}$/i.test(meta.upstream_commit)) {
    throw new CliError(3, "✗ 货架 upstream_commit 缺失或格式非法,拒绝回退上游 HEAD。");
  }
  const match = String(meta.upstream ?? "").match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/tree\/[^/]+\/?(.*)$/);
  if (!match) throw new CliError(3, "无法解析货架上游地址,拒绝猜测仓库或路径。");
  return { repo: match[1], subpath: match[2] ?? "", commit: meta.upstream_commit };
}

async function checkoutPinnedUpstream(meta, work) {
  const source = pinnedGitHubSource(meta);
  try {
    await exec("git", ["init", "--quiet", work]);
    await exec("git", ["-C", work, "remote", "add", "origin", `https://github.com/${source.repo}.git`]);
    await exec("git", ["-C", work, "fetch", "--depth", "1", "--quiet", "origin", source.commit]);
    await exec("git", ["-C", work, "checkout", "--detach", "--quiet", "FETCH_HEAD"]);
  } catch (error) {
    throw new CliError(3, `获取 pinned commit ${source.commit.slice(0, 12)}… 失败,未回退 HEAD:${error.message}`);
  }
  return join(work, source.subpath);
}

async function add(id) {
  const report = await fetchReport(id);
  const m = report.meta;
  if (!m || m.id !== id) throw new CliError(3, `货架返回的 Skill 身份与请求不一致:${m?.id ?? "<missing>"}`);
  const expected = requireSourceHash(m);
  if (m.delisted_at) throw new CliError(3, `✗ ${m.id} 已停止收录,拒绝新安装。`);

  const destRoot = await detectAgentDir();
  const dest = join(destRoot, m.id.split("/").at(-1));
  if (await pathExists(dest)) {
    throw new CliError(6, `✗ 目标已存在:${dest}\n  当前版本不覆盖既有目录;请先 verify/remove,或选择其他明确目标。`);
  }

  console.log(`\n■ ${m.id}  (${m.license} / ${m.hosting})`);
  const v = await loadVerdict(id, expected);
  if (v) {
    console.log(`  判定: ${v.status}(policy ${v.scanner?.policy})—— 披露非背书`);
    for (const [k, f] of Object.entries(v.factors ?? {})) {
      console.log(`    ${k}: ${f.present === true ? "含" : f.present === false ? "无" : "未判定"}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }
  if (!(await confirm("确认安装?"))) return console.log("已取消");

  // 获取文件:本地完整 mirror,或精确 fetch 货架记录的 upstream_commit。
  const work = join(tmpdir(), `oh-my-skill-${randomUUID()}`);
  await mkdir(work, { recursive: true });
  const staging = join(destRoot, `.${m.id.split("/").at(-1)}.oms-staging-${randomUUID()}`);
  try {
    const local = opt("from-dir");
    const srcDir = local && m.hosting === "mirrored" && m.mirror_complete === true
      ? join(local, ...m.id.split("/"), "mirror")
      : await checkoutPinnedUpstream(m, work);

    let actual;
    try { actual = await dirContentHash(srcDir); }
    catch (error) { throw new CliError(3, `读取待安装内容失败:${error.message}`); }
    if (actual !== expected) {
      throw new CliError(4, `✗ 内容哈希不匹配!货架 ${expected.slice(0, 20)}… vs 实际 ${actual.slice(0, 20)}…\n  内容可能在收录后被修改,已拒绝安装。`);
    }
    console.log(`  ✓ 内容哈希校验通过 ${actual.slice(0, 27)}…`);

    await mkdir(destRoot, { recursive: true });
    await cp(srcDir, staging, { recursive: true, force: false, errorOnExist: true });
    const stagedHash = await dirContentHash(staging);
    if (stagedHash !== expected) throw new CliError(4, "✗ staging 复算哈希不一致,已拒绝落盘。");
    if (await pathExists(dest)) throw new CliError(6, `✗ 安装期间目标被创建:${dest};未覆盖。`);
    await rename(staging, dest);
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(7, `本地写入失败:${error.message}`);
  } finally {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
  console.log(`✓ 已安装到 ${dest}\n`);
  if (opt("to")) await rememberDir(opt("to")); // 一次教会:自定义安装路径记住,verify 默认搜得到
  await postReceipt(m.id, "cli", expected); // 装成才留痕;3s 超时,失败静默
}

/**
 * verify:不重装,验证本机已装副本(ADR 0017 路径③——存量用户的主通道:
 * 早期用户多已通过别的渠道装过,没必要为了身份再装一次)。
 * 语义红线:verify 只证明「本机确有此物」,不证明来源——回执 channel=verify,
 * 徽章措辞对应「已验证本机安装」,与 download/cli 的「从本店安装」分档。
 *   oh-my-skill verify <owner/repo/name> [--to <dir>] [--t <码>]
 *   oh-my-skill verify --all          扫描本地全部已装 skill,逐个与货架比对(顺带当 outdated 用)
 */
/**
 * 技能目录搜索面:--to 显式指定 > 已记住的自定义路径 + 常见约定(用户级/项目级/.agents)。
 * 路径千人千面,硬编码猜不全——所以「一次教会」:--to 验证/安装成功后记进
 * ~/.oh-my-skill/dirs.json,之后默认搜索自动带上,不用每次都 --to。
 */
const DIRS_FILE = join(homedir(), ".oh-my-skill", "dirs.json");
async function rememberDir(dir) {
  try {
    let dirs = [];
    try { dirs = JSON.parse(await readFile(DIRS_FILE, "utf8")); } catch { /* 首次 */ }
    if (!dirs.includes(dir)) {
      dirs.push(dir);
      await mkdir(dirname(DIRS_FILE), { recursive: true });
      await writeFile(DIRS_FILE, JSON.stringify(dirs, null, 2) + "\n");
      console.log(`ℹ 已记住技能目录 ${dir}(下次不用带 --to;记录在 ~/.oh-my-skill/dirs.json)`);
    }
  } catch { /* 记不住也不影响本次 */ }
}
async function agentDirs() {
  const to = opt("to");
  if (to) return [resolve(to)]; // 显式指定 = 只看这里(用户意图明确)
  const requestedAgent = opt("agent");
  if (requestedAgent && requestedAgent !== "all") return [await detectAgentDir()];
  const requestedScope = opt("scope");
  if (requestedScope && !["user", "project"].includes(requestedScope)) {
    throw new CliError(2, `未知 scope: ${requestedScope}。可选:user, project`);
  }
  const scopes = requestedScope ? [requestedScope] : ["user", "project"];
  const dirs = [];
  for (const agentId of Object.keys(AGENT_SPECS)) {
    for (const scope of scopes) dirs.push(await agentDir(agentId, scope));
  }
  dirs.push(join(homedir(), ".agents", "skills"), join(await projectRoot(), ".agents", "skills"));
  try { dirs.push(...JSON.parse(await readFile(DIRS_FILE, "utf8"))); } catch { /* 无记忆 */ }
  return [...new Set(dirs)];
}
async function findLocal(leaf) {
  for (const d of await agentDirs()) {
    try { if ((await stat(join(d, leaf))).isDirectory()) return join(d, leaf); } catch { /* 该目录无此 skill */ }
  }
  return null;
}
async function verifyOne(id, { quiet = false } = {}) {
  const report = await fetchReport(id);
  const m = report.meta;
  const expected = requireSourceHash(m);
  const leaf = m.id.split("/").at(-1);
  const local = await findLocal(leaf);
  if (!local) {
    if (!quiet) {
      console.log(`✗ 本机未找到 ${leaf}(查过 ${(await agentDirs()).join(" / ")};装在别处用 --to 指路径,成功后会记住)`);
      console.log(`  提示:下载的 .skill 文件躺在下载文件夹里不算安装——拖进 Claude 或 \`oh-my-skill add\` 才算;`);
      console.log(`  另外,从网站下载本身已留有记录,写短评不需要再跑 verify。`);
    }
    return false;
  }
  const actual = await dirContentHash(local);
  const match = actual === expected;
  console.log(match
    ? `✓ ${m.id} — 本机副本与货架一致 ${actual.slice(0, 27)}…`
    : `△ ${m.id} — 本机副本与货架不同(旧版本或已自行修改);按实际内容留痕`);
  if (opt("to")) await rememberDir(opt("to")); // 一次教会:自定义路径验证成功即记住
  await postReceipt(m.id, "verify", actual); // 回执记「实际持有」的哈希,评价侧据此显示「评于版本」
  return true;
}
async function verifyAll() {
  let seen = 0, verified = 0;
  for (const d of await agentDirs()) {
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
  const dir = await detectAgentDir();
  try {
    for (const name of await readdir(dir)) console.log(name);
  } catch { console.log(`(空:${dir})`); }
}

async function remove(id) {
  const dest = join(await detectAgentDir(), id.includes("/") ? id.split("/").at(-1) : id);
  if (await confirm(`删除 ${dest}?`)) { await rm(dest, { recursive: true, force: true }); console.log("✓ 已删除"); }
}

const run = { add, list, remove, verify: verifyOne }[cmd];
if (!run || (cmd !== "list" && !target && !(cmd === "verify" && flag("all")))) {
  console.log("用法: oh-my-skill add <owner/repo/name>… [--agent <id>] [--scope user|project] [--yes]");
  console.log("      oh-my-skill verify <owner/repo/name> | verify --all   已装过?验证本机副本,不重装");
  console.log("      oh-my-skill list | remove <name> [--agent <id>] [--scope user|project]");
  console.log("      通用覆盖:--to <dir> --from-dir <catalog> --project-root <dir>");
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
})().catch((e) => { console.error(e.message); process.exit(e instanceof CliError ? e.exitCode : 1); });
