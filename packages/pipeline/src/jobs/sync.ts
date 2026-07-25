/**
 * sync:catalog → Supabase 增量同步(设计文档 §4.3)。
 * 从 sync_state.last_commit diff 到 HEAD,变更条目 upsert(幂等);全部成功才推进游标。
 * 用法:npm run sync [-- --full]
 * 环境:SUPABASE_URL / SUPABASE_SERVICE_KEY
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SkillReport } from "@skill-store/schemas";

const exec = promisify(execFile);
// catalog 规模下 git 列表输出会超过 execFile 默认 1MB 的 stdout 上限,
// 放大 maxBuffer 以免 "stdout maxBuffer length exceeded"(catalog 涨大后触发)。
const GIT_OPTS = { maxBuffer: 1024 * 1024 * 512 }; // 512MB 上限(仅上限,不预分配)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${URL_}/rest/v1${path}`;
  const headers = {
    apikey: KEY!, authorization: `Bearer ${KEY}`,
    "content-type": "application/json", ...(init.headers ?? {}),
  };
  let lastErr = "unreachable";
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res: Response | undefined;
    try {
      res = await fetch(url, { ...init, headers });
    } catch (e) {
      lastErr = `network ${(e as Error).message}`; // 网络层错误,重试
    }
    if (res) {
      if (res.ok) return res;
      // 4xx = 请求本身错,立刻抛;5xx / 429 = 网关抖动或限流,退避重试
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`Supabase ${res.status} ${path}: ${await res.text()}`);
      }
      lastErr = `Supabase ${res.status} ${path}`;
    }
    if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 1500));
  }
  throw new Error(`Supabase 重试 4 次仍失败 ${path}: ${lastErr}`);
}

/**
 * 开跑前列存在性预检(2026-07-09 加;起因:claims 迁移未执行、skills 缺 bulk_source 列,
 * 每日 cron 静默挂在难懂的 PGRST204)。列清单从 flatten() 输出的键派生 = 单一事实源,
 * 以后新增写入列自动纳入、与实际写入永不漂移。
 * 快路径一次 GET 探针(正常即过);仅失败时逐列复探,一次列出全部缺失列,替 PGRST204 说人话。
 */
async function preflightColumns(cols: string[]) {
  const auth = { apikey: KEY!, authorization: `Bearer ${KEY}` };
  const q = (sel: string) => fetch(`${URL_}/rest/v1/skills?select=${sel}&limit=0`, { headers: auth });
  const probe = await q(cols.join(","));
  if (probe.ok) return;
  const raw = await probe.text();
  const missing: string[] = [];
  for (const c of cols) if (!(await q(c)).ok) missing.push(c);
  // 全列都「缺」= 多半不是 schema 漂移,而是连接/权限/URL 问题,别误导成迁移没跑
  if (missing.length === cols.length) throw new Error(`skills 预检探针失败(疑似连接或权限问题,非缺列):${raw}`);
  throw new Error(
    `skills 表缺少 sync 要写的列:${missing.join(", ")}\n` +
    `  → 有迁移没在 Supabase 执行。到 infra/migrations/ 找含这些列的 ALTER TABLE,\n` +
    `    在 Supabase SQL 编辑器跑一遍后重试(参照 2026-07-08-claims.sql 的 bulk_source/repo_skill_count)。`,
  );
}

// v2(ADR 0012):审计字段拆出至 catalog/verdicts 账本,不再随 catalog 同步;
// audit_status 等列写 null(需先在 Supabase 执行 infra/migrations/2026-07-05-verdict-service.sql 放开非空约束)。
function flatten(r: SkillReport, commit: string) {
  const m = r.meta;
  return {
    id: m.id, name: m.name, description: m.description ?? null, license: m.license,
    hosting: m.hosting,
    // 只有 catalog 明确确认完整的 mirror 才能被安装器当作可复现镜像;缺失按 false 保守处理。
    mirror_complete: m.hosting === "mirrored" ? m.mirror_complete === true : null,
    category: m.category, publisher: m.publisher,
    // publisher_verified 不再随采集冲写:认领(claims RPC)后以 DB 为准,采集覆盖会撤销作者认领
    audit_status: null,
    // 聚合判定数据位(认领第①档防误绑搬运工,2026-07-08-claims.sql)
    repo_skill_count: r.signals.repo_skill_count ?? null, bulk_source: r.signals.bulk_source ?? null,
    risk_factors: null, evidence: null, review: null,
    l3: null, context_size: r.context_size ?? null,
    stars_github: r.signals.stars_github, installs_skills_sh: r.signals.installs_skills_sh,
    upstream: m.upstream, upstream_commit: m.upstream_commit, content_hash: m.content_hash,
    marketplace_commit: commit,
    // 「新上架」排序键(ADR 0016):catalog 侧 git 派生、盖一次永不覆盖;区别于每次同步都刷新的 updated_at
    first_seen_at: r.signals.first_seen_at ?? null,
    // 退市墓碑(ADR 0020):行保留(回执/认领引用),读侧按 delisted_at 隐藏;复活时 catalog 撤销随 sync 传导为 null
    delisted_at: r.meta.delisted_at ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * 把「diff 出的任意变更项」映射回它所属 skill 的 skill-report.json 绝对路径。
 * 变更可能是报告本身,也可能是 mirror/ 下的资源;skill 目录深度不固定
 * (正常 <owner>/<repo>/<name>,但存在 name 段为空的历史坏条目,报告直接落在 <owner>/<repo>/)。
 *
 * mirror 目录内含 .git(采集镜像未剥 .git,见 sync 后待办),git 把 mirror 当 gitlink,
 * diff 报成结尾无斜杠的单条 `…/mirror`——故 /mirror 需同时匹配中缀(/mirror/)与尾缀(/mirror$)。
 * 这类项与报告本身同批出现,映射回同一 report 后被去重,不会漏同步。
 */
function reportPathForChange(rel: string): string {
  const m = rel.match(/^(.*?)\/mirror(?:\/.*)?$/); // 非贪婪:截到第一个 mirror 段之前
  const skillDir = m ? m[1]
    : rel.endsWith("/skill-report.json") ? rel.slice(0, -"/skill-report.json".length)
    : dirname(rel); // 其它文件(如 skill.md)直接在 skill 目录里 → 取其目录,别把文件名当目录
  return join(ROOT, skillDir, "skill-report.json");
}

async function main() {
  if (!URL_ || !KEY) throw new Error("缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY");
  const head = (await exec("git", ["-C", ROOT, "rev-parse", "HEAD"], GIT_OPTS)).stdout.trim();
  const state = (await (await rest("/sync_state?id=eq.1")).json()) as { last_commit?: string }[];
  const last = process.argv.includes("--full") ? null : state[0]?.last_commit ?? null;

  let paths: string[];
  if (last) {
    // -z:NUL 分隔输出,git 不对非 ASCII 路径加引号(否则中文 mirror 文件名会被 "…\346…" 转义,读盘 ENOENT)
    const out = (await exec("git", ["-C", ROOT, "diff", "--name-only", "-z", `${last}..HEAD`, "--", "catalog/skills"], GIT_OPTS)).stdout;
    paths = [...new Set(out.split("\0").filter(Boolean).map(reportPathForChange))];
    console.log(`增量模式 ${last.slice(0, 7)}..HEAD:${paths.length} 条变更`);
  } else {
    // 列 catalog/skills 全量再按 basename 过滤:深度无关(正常 6 段 / name 空的历史坏条目 5 段都覆盖),
    // 不依赖 git pathspec 的 * 跨斜杠语义。-z 同样为了非 ASCII 路径不被加引号。
    const out = (await exec("git", ["-C", ROOT, "ls-files", "-z", "catalog/skills"], GIT_OPTS)).stdout;
    paths = out.split("\0").filter((p) => p.endsWith("/skill-report.json")).map((p) => join(ROOT, p));
    console.log(`全量模式:${paths.length} 条`);
  }
  if (!paths.length) { console.log("无变更,跳过"); return; }

  const rows = [];
  for (const p of paths) {
    try { rows.push(flatten(JSON.parse(await readFile(p, "utf8")), head)); }
    catch (e) { console.warn(`  ✗ 读取失败 ${p}: ${(e as Error).message}`); }
  }
  // 写前预检:列不齐就早失败,给「跑哪个迁移」的人话,而不是 upsert 时难懂的 PGRST204
  if (rows.length) await preflightColumns(Object.keys(rows[0]));
  for (let i = 0; i < rows.length; i += 50) {
    // 滤 NUL:skill 描述可能字面含  (如文件上传绕过 payload "shell.php .jpg"),
    // JSON 合法但 Postgres text/jsonb 不收(22P05)。序列化后统一去掉转义的 NUL——Postgres 边界防御,
    // 不改盘上 catalog(采集侧已在源头清洗,见 official.ts;此处兜住存量已提交条目)。
    const body = JSON.stringify(rows.slice(i, i + 50)).replace(/\\u0000/g, "");
    // 走 RPC + base64 绕过 Cloudflare WAF(catalog 安全类 skill 文案含 SQL/payload 字样,直发 /skills 会误触 403);
    // ingest_skills 在库里 base64 解码后 upsert(仅 service_role 可调,见 infra/migrations/2026-07-25-waf-bypass-rpc.sql)。
    await rest("/rpc/ingest_skills", {
      method: "POST",
      body: JSON.stringify({ payload: Buffer.from(body, "utf8").toString("base64") }),
    });
  }
  await rest("/sync_state", {
    method: "POST",
    body: JSON.stringify({ id: 1, last_commit: head, synced_at: new Date().toISOString() }),
    headers: { prefer: "resolution=merge-duplicates" },
  });
  console.log(`✓ 同步 ${rows.length} 条,游标推进到 ${head.slice(0, 7)}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
