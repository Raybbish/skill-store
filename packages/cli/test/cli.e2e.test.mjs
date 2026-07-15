import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const CLI = fileURLToPath(new URL("../bin/oh-my-skill.mjs", import.meta.url));
const SKILL_ID = "owner/repo/demo";
const SKILL_BODY = "---\nname: demo\ndescription: fixture\n---\n\n# Demo\n";
const LICENSE_EVIDENCE = "Store-injected upstream license evidence\n";

function blobSha(content) {
  const body = Buffer.from(content);
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

function fixtureHash() {
  const line = `SKILL.md:${blobSha(SKILL_BODY)}`;
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
      content_hash: fixtureHash(),
      ...meta,
    },
  };
  await writeFile(join(skillRoot, "skill-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return { root, home, catalog };
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

test("explicit agent and user scope install into that agent only", async (t) => {
  const ctx = await fixture(t);
  const result = run(ctx, "add", SKILL_ID, "--agent", "codex", "--scope", "user", "--yes");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(join(ctx.home, ".codex", "skills", "demo", "SKILL.md"), "utf8"), SKILL_BODY);
  assert.equal(await readFile(join(ctx.home, ".codex", "skills", "demo", "LICENSE.upstream"), "utf8"), LICENSE_EVIDENCE);
  await assert.rejects(readFile(join(ctx.home, ".claude", "skills", "demo", "SKILL.md"), "utf8"));
});

test("missing content_hash fails with exit 4 before writing", async (t) => {
  const ctx = await fixture(t, { content_hash: null });
  const destination = join(ctx.root, "install");
  const result = run(ctx, "add", SKILL_ID, "--to", destination, "--yes");
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /content_hash/);
  await assert.rejects(readFile(join(destination, "demo", "SKILL.md"), "utf8"));
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
