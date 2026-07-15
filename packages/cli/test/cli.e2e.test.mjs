import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const CLI = fileURLToPath(new URL("../bin/oh-my-skill.mjs", import.meta.url));
const SKILL_ID = "owner/repo/demo";
const SKILL_BODY = "---\nname: demo\ndescription: fixture\n---\n\n# Demo\n";
const LICENSE_EVIDENCE = "Store-injected upstream license evidence\n";

function blobSha(content) {
  const body = Buffer.from(content);
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

function contentHash(content) {
  const line = `SKILL.md:${blobSha(content)}`;
  return `sha256:${createHash("sha256").update(line).digest("hex")}`;
}

async function fixture(t, meta = {}) {
  const root = await mkdtemp(join(tmpdir(), "oh-my-skill-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, "home");
  const catalog = join(root, "catalog", "skills");
  const skillRoot = join(catalog, ...SKILL_ID.split("/"));
  await mkdir(join(skillRoot, "mirror"), { recursive: true });
  await mkdir(home, { recursive: true });
  await writeFile(join(skillRoot, "mirror", "SKILL.md"), SKILL_BODY);
  await writeFile(join(skillRoot, "mirror", "LICENSE.upstream"), LICENSE_EVIDENCE);
  const report = {
    schema_version: "2",
    meta: {
      id: SKILL_ID,
      name: "demo",
      hosting: "mirrored",
      mirror_complete: true,
      license: "MIT",
      upstream: "https://github.com/owner/repo/tree/main/demo",
      upstream_commit: "0123456789abcdef0123456789abcdef01234567",
      content_hash: contentHash(SKILL_BODY),
      ...meta,
    },
  };
  const reportPath = join(skillRoot, "skill-report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { root, home, catalog, skillRoot, reportPath };
}

async function updateFixture(ctx, body) {
  const report = JSON.parse(await readFile(ctx.reportPath, "utf8"));
  report.meta.content_hash = contentHash(body);
  await writeFile(join(ctx.skillRoot, "mirror", "SKILL.md"), body);
  await writeFile(ctx.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report.meta.content_hash;
}

function runWithEnv(ctx, extraEnv, ...args) {
  return spawnSync(process.execPath, [CLI, ...args, "--from-dir", ctx.catalog], {
    cwd: ctx.root,
    encoding: "utf8",
    env: { ...process.env, HOME: ctx.home, KIMI_CODE_HOME: "", OMS_TELEMETRY: "0", ...extraEnv },
  });
}

function run(ctx, ...args) {
  return runWithEnv(ctx, {}, ...args);
}

function runAsync(ctx, ...args) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [CLI, ...args, "--from-dir", ctx.catalog], {
      cwd: ctx.root,
      env: { ...process.env, HOME: ctx.home, KIMI_CODE_HOME: "", OMS_TELEMETRY: "0" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => done({ status, stdout, stderr }));
  });
}

test("explicit agent and user scope install into that agent only", async (t) => {
  const ctx = await fixture(t);
  const result = run(ctx, "add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(ctx.home, ".codex", "skills", "demo", "SKILL.md"), "utf8"), SKILL_BODY);
  assert.equal(await readFile(join(ctx.home, ".codex", "skills", "demo", "LICENSE.upstream"), "utf8"), LICENSE_EVIDENCE);
  await assert.rejects(readFile(join(ctx.home, ".claude", "skills", "demo", "SKILL.md"), "utf8"));
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.schema_version, "1");
  assert.equal(state.installs.length, 1);
  assert.equal(state.installs[0].skill_id, SKILL_ID);
  assert.equal(state.installs[0].agent_id, "codex");
  assert.equal(state.installs[0].scope, "user");
  assert.equal(state.installs[0].source_content_hash, contentHash(SKILL_BODY));
});

test("a managed current install is idempotent", async (t) => {
  const ctx = await fixture(t);
  const args = ["add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes"];
  assert.equal(run(ctx, ...args).status, 0);
  const second = run(ctx, ...args);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /已是当前版本/);
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.installs.length, 1);
});

test("a clean managed install updates transactionally", async (t) => {
  const ctx = await fixture(t);
  const args = ["add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes"];
  assert.equal(run(ctx, ...args).status, 0);
  const nextBody = `${SKILL_BODY}\nUpdated\n`;
  const nextHash = await updateFixture(ctx, nextBody);
  const updated = run(ctx, ...args);
  assert.equal(updated.status, 0, updated.stderr);
  assert.match(updated.stdout, /已更新到/);
  assert.equal(await readFile(join(ctx.home, ".codex", "skills", "demo", "SKILL.md"), "utf8"), nextBody);
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.installs.length, 1);
  assert.equal(state.installs[0].source_content_hash, nextHash);
});

test("concurrent installs do not lose state entries", async (t) => {
  const ctx = await fixture(t);
  const common = ["add", SKILL_ID, "--scope", "user", "--yes"];
  const [claude, codex] = await Promise.all([
    runAsync(ctx, ...common, "--agent", "claude"),
    runAsync(ctx, ...common, "--agent", "codex"),
  ]);
  assert.equal(claude.status, 0, claude.stderr);
  assert.equal(codex.status, 0, codex.stderr);
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.installs.length, 2);
  assert.deepEqual(state.installs.map((entry) => entry.agent_id).sort(), ["claude", "codex"]);
});

test("missing content_hash fails with exit 4 before writing", async (t) => {
  const ctx = await fixture(t, { content_hash: null });
  const destination = join(ctx.root, "install");
  const result = run(ctx, "add", SKILL_ID, "--to", destination, "--yes");
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /content_hash/);
  await assert.rejects(readFile(join(destination, "demo", "SKILL.md"), "utf8"));
});

test("single-target JSON errors remain machine parseable", async (t) => {
  const ctx = await fixture(t, { content_hash: null });
  const result = run(ctx, "add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes", "--json");
  assert.equal(result.status, 4, result.stderr);
  assert.equal(result.stderr, "");
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "error");
  assert.equal(payload.code, 4);
  assert.match(payload.message, /content_hash/);
});

test("JSON mode refuses to prompt without --yes", async (t) => {
  const ctx = await fixture(t);
  const result = run(ctx, "add", SKILL_ID, "--agent", "codex", "--scope", "user", "--json");
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).code, 2);
});

test("no detected agent refuses the old implicit Claude fallback", async (t) => {
  const ctx = await fixture(t);
  const result = run(ctx, "add", SKILL_ID, "--yes");
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /未探测到唯一 Agent/);
  await assert.rejects(readFile(join(ctx.home, ".claude", "skills", "demo", "SKILL.md"), "utf8"));
});

test("Kimi user scope follows KIMI_CODE_HOME", async (t) => {
  const ctx = await fixture(t);
  const kimiHome = join(ctx.root, "custom-kimi-home");
  const result = runWithEnv(ctx, { KIMI_CODE_HOME: kimiHome }, "add", SKILL_ID, "--agent", "kimi", "--scope", "user", "--yes");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(kimiHome, "skills", "demo", "SKILL.md"), "utf8"), SKILL_BODY);
});

test("multiple detected agent directories require an explicit choice", async (t) => {
  const ctx = await fixture(t);
  await mkdir(join(ctx.home, ".claude", "skills"), { recursive: true });
  await mkdir(join(ctx.home, ".codex", "skills"), { recursive: true });
  const result = run(ctx, "add", SKILL_ID, "--yes");
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /探测到多个 Agent/);
});

test("an existing unmanaged destination is not overwritten", async (t) => {
  const ctx = await fixture(t);
  const destination = join(ctx.root, "install");
  const existing = join(destination, "demo", "SKILL.md");
  await mkdir(dirname(existing), { recursive: true });
  await writeFile(existing, "keep me\n");
  const result = run(ctx, "add", SKILL_ID, "--to", destination, "--yes");
  assert.equal(result.status, 6, result.stderr);
  assert.equal(await readFile(existing, "utf8"), "keep me\n");
});

test("an incomplete mirror cannot bypass a missing pinned commit", async (t) => {
  const ctx = await fixture(t, { mirror_complete: false, upstream_commit: null });
  const destination = join(ctx.root, "install");
  const result = run(ctx, "add", SKILL_ID, "--to", destination, "--yes");
  assert.equal(result.status, 3, result.stderr);
  assert.match(result.stderr, /upstream_commit/);
  await assert.rejects(readFile(join(destination, "demo", "SKILL.md"), "utf8"));
});

test("--agent all reports partial success as exit 8 and one JSON object", async (t) => {
  const ctx = await fixture(t);
  await mkdir(join(ctx.home, ".claude", "skills"), { recursive: true });
  const conflict = join(ctx.home, ".codex", "skills", "demo", "SKILL.md");
  await mkdir(dirname(conflict), { recursive: true });
  await writeFile(conflict, "unmanaged\n");

  const result = run(ctx, "add", SKILL_ID, "--agent", "all", "--scope", "user", "--yes", "--json");
  assert.equal(result.status, 8, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "partial");
  assert.equal(payload.code, 8);
  assert.equal(payload.succeeded.length, 1);
  assert.equal(payload.succeeded[0].agent_id, "claude");
  assert.equal(payload.failed.length, 1);
  assert.equal(payload.failed[0].agent_id, "codex");
  assert.equal(payload.failed[0].code, 6);
  assert.equal(await readFile(join(ctx.home, ".claude", "skills", "demo", "SKILL.md"), "utf8"), SKILL_BODY);
  assert.equal(await readFile(conflict, "utf8"), "unmanaged\n");
});

test("--agent all succeeds for every detected target", async (t) => {
  const ctx = await fixture(t);
  await mkdir(join(ctx.home, ".claude", "skills"), { recursive: true });
  await mkdir(join(ctx.home, ".codex", "skills"), { recursive: true });
  const result = run(ctx, "add", SKILL_ID, "--agent", "all", "--scope", "user", "--yes", "--json");
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "success");
  assert.equal(payload.succeeded.length, 2);
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.installs.length, 2);
});

test("remove only deletes a managed install and its state entry", async (t) => {
  const ctx = await fixture(t);
  const common = ["--agent", "codex", "--scope", "user", "--yes"];
  assert.equal(run(ctx, "add", SKILL_ID, ...common).status, 0);
  const removed = run(ctx, "remove", SKILL_ID, ...common, "--json");
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(JSON.parse(removed.stdout).details.status, "removed");
  await assert.rejects(readFile(join(ctx.home, ".codex", "skills", "demo", "SKILL.md"), "utf8"));
  const state = JSON.parse(await readFile(join(ctx.home, ".oh-my-skill", "state.json"), "utf8"));
  assert.equal(state.installs.length, 0);
});

test("a corrupt state file blocks writes without touching the installed directory", async (t) => {
  const ctx = await fixture(t);
  const args = ["add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes"];
  assert.equal(run(ctx, ...args).status, 0);
  const installed = join(ctx.home, ".codex", "skills", "demo", "SKILL.md");
  await writeFile(join(ctx.home, ".oh-my-skill", "state.json"), "{broken\n");
  const result = run(ctx, ...args);
  assert.equal(result.status, 7, result.stderr);
  assert.equal(await readFile(installed, "utf8"), SKILL_BODY);
});
