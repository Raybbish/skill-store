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
  const res = await fetch(`${URL_}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: KEY!, authorization: `Bearer ${KEY}`,
      "content-type": "application/json", ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} ${path}: ${await res.text()}`);
  return res;
}

// v2(ADR 0012):审计字段拆出至 catalog/verdicts 账本,不再随 catalog 同步;
// audit_status 等列写 null(需先在 Supabase 执行 infra/migrations/2026-07-05-verdict-service.sql 放开非空约束)。
function flatten(r: SkillReport, commit: string) {
  const m = r.meta;
  return {
    id: m.id, name: m.name, description: m.description ?? null, license: m.license,
    hosting: m.hosting, category: m.category, publisher: m.publisher,
    publisher_verified: m.publisher_verified, audit_status: null,
    risk_factors: null, evidence: null, review: null,
    l3: null, context_size: r.context_size ?? null,
    stars_github: r.signals.stars_github, installs_skills_sh: r.signals.installs_skills_sh,
    upstream: m.upstream, upstream_commit: m.upstream_commit, content_hash: m.content_hash,
    marketplace_commit: commit, updated_at: new Date().toISOString(),
  };
}

async function main() {
  if (!URL_ || !KEY) throw new Error("缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY");
  const head = (await exec("git", ["-C", ROOT, "rev-parse", "HEAD"], GIT_OPTS)).stdout.trim();
  const state = (await (await rest("/sync_state?id=eq.1")).json()) as { last_commit?: string }[];
  const last = process.argv.includes("--full") ? null : state[0]?.last_commit ?? null;

  let paths: string[];
  if (last) {
    const out = (await exec("git", ["-C", ROOT, "diff", "--name-only", `${last}..HEAD`, "--", "catalog/skills"], GIT_OPTS)).stdout;
    // catalog/skills/<owner>/<repo>/<name> = 5 段
    paths = [...new Set(out.split("\n").filter(Boolean).map((p) => p.split("/").slice(0, 5).join("/")))]
      .map((p) => join(ROOT, p, "skill-report.json"));
    console.log(`增量模式 ${last.slice(0, 7)}..HEAD:${paths.length} 条变更`);
  } else {
    const out = (await exec("git", ["-C", ROOT, "ls-files", "catalog/skills/*/*/*/skill-report.json"], GIT_OPTS)).stdout;
    paths = out.split("\n").filter(Boolean).map((p) => join(ROOT, p));
    console.log(`全量模式:${paths.length} 条`);
  }
  if (!paths.length) { console.log("无变更,跳过"); return; }

  const rows = [];
  for (const p of paths) {
    try { rows.push(flatten(JSON.parse(await readFile(p, "utf8")), head)); }
    catch (e) { console.warn(`  ✗ 读取失败 ${p}: ${(e as Error).message}`); }
  }
  for (let i = 0; i < rows.length; i += 50) {
    await rest("/skills", {
      method: "POST", body: JSON.stringify(rows.slice(i, i + 50)),
      headers: { prefer: "resolution=merge-duplicates" },
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
