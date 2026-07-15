import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactSha256, createDeterministicSkillArtifact } from "../lib/artifact.mjs";
import { sourceContentHashDirectory } from "../lib/content-hash.mjs";
import { planArtifactGc, planReleaseGc } from "../../../scripts/lib/artifact-store-core.mjs";

const STORE = fileURLToPath(new URL("../../../scripts/artifact-store.mjs", import.meta.url));
const A = "a".repeat(64);
const B = "b".repeat(64);
const SOURCE = `sha256:${"c".repeat(64)}`;

function indexFor(entries) {
  return {
    schema_version: "1",
    artifacts: entries.map((hex, position) => ({
      skill_id: `owner/repo/skill-${position}`,
      source_content_hash: SOURCE,
      artifact_sha256: `sha256:${hex}`,
      artifact_url: `https://cdn.example/artifacts/sha256/${hex}.skill`,
      artifact_size: 10,
    })),
  };
}

function objectPair(hex, modified = "2025-01-01T00:00:00Z") {
  return ["skill", "json"].map((extension) => ({
    key: `artifacts/sha256/${hex}.${extension}`,
    size: 10,
    lastModified: modified,
  }));
}

test("GC starts the orphan clock and only deletes after 180 unreferenced days", () => {
  const first = planArtifactGc({
    objects: [...objectPair(A), ...objectPair(B)],
    indexes: [indexFor([A])],
    now: "2026-01-01T00:00:00Z",
  });
  assert.deepEqual(first.deleteKeys, []);
  assert.deepEqual(first.nextState.artifacts, { [B]: { unreferenced_since: "2026-01-01T00:00:00.000Z" } });
  assert.equal(first.audit.newly_orphaned_artifacts, 1);

  const expired = planArtifactGc({
    objects: [...objectPair(A), ...objectPair(B)],
    indexes: [indexFor([A])],
    state: first.nextState,
    now: "2026-07-01T00:00:00Z",
  });
  assert.deepEqual(expired.deleteKeys, [
    `artifacts/sha256/${B}.json`,
    `artifacts/sha256/${B}.skill`,
  ]);
  assert.deepEqual(expired.nextState.artifacts, {});
});

test("pinned release references protect artifacts and referenced tombstones fail closed", () => {
  const protectedPlan = planArtifactGc({
    objects: [...objectPair(A), ...objectPair(B)],
    indexes: [indexFor([A]), indexFor([B])],
    state: { schema_version: "1", artifacts: { [B]: { unreferenced_since: "2020-01-01T00:00:00Z" } } },
    now: "2026-07-01T00:00:00Z",
  });
  assert.deepEqual(protectedPlan.deleteKeys, []);
  assert.deepEqual(protectedPlan.nextState.artifacts, {});
  assert.throws(() => planArtifactGc({
    objects: objectPair(A),
    indexes: [indexFor([A])],
    tombstones: [`sha256:${A}`],
  }), /tombstone 仍被/);
  assert.throws(() => planArtifactGc({
    objects: [objectPair(A)[0]],
    indexes: [indexFor([A])],
  }), /引用制品对象不完整/);
});

test("unpinned release snapshots expire independently while pinned snapshots remain", () => {
  const plan = planReleaseGc({
    objects: [
      { key: "artifacts/releases/current.json", lastModified: "2026-06-20T00:00:00Z" },
      { key: "artifacts/releases/old.json", lastModified: "2026-01-01T00:00:00Z" },
      { key: "artifacts/releases/pinned.json", lastModified: "2026-01-01T00:00:00Z" },
    ],
    pinnedReleases: ["pinned"],
    now: "2026-07-15T00:00:00Z",
  });
  assert.deepEqual(plan.deleteKeys, ["artifacts/releases/old.json"]);
  assert.equal(plan.audit.pinned_release_snapshots, 1);
});

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "oms-store-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const mirror = join(root, "mirror");
  const build = join(root, "build");
  const store = join(root, "store");
  await mkdir(mirror, { recursive: true });
  await mkdir(join(build, "sha256"), { recursive: true });
  await writeFile(join(mirror, "SKILL.md"), "---\nname: demo\ndescription: store test\n---\n");
  await writeFile(join(mirror, "LICENSE.upstream"), "MIT\n");
  const sourceHash = await sourceContentHashDirectory(mirror);
  const artifact = await createDeterministicSkillArtifact(mirror, "demo");
  const artifactHash = artifactSha256(artifact);
  const hex = artifactHash.slice(7);
  const manifest = {
    schema_version: "1",
    artifact_sha256: artifactHash,
    source_content_hash: sourceHash,
    size: artifact.length,
  };
  const index = {
    schema_version: "1",
    artifacts: [{
      skill_id: "owner/repo/demo",
      source_content_hash: sourceHash,
      artifact_sha256: artifactHash,
      artifact_url: `https://cdn.example/artifacts/sha256/${hex}.skill`,
      artifact_size: artifact.length,
    }],
  };
  await writeFile(join(build, "sha256", `${hex}.skill`), artifact);
  await writeFile(join(build, "sha256", `${hex}.json`), `${JSON.stringify(manifest)}\n`);
  await writeFile(join(build, "index.json"), `${JSON.stringify(index)}\n`);
  return { root, build, store, hex, manifest };
}

function runStore(ctx, command, extraEnv = {}, ...extraArgs) {
  return spawnSync(process.execPath, [STORE, command, "--json", ...extraArgs], {
    encoding: "utf8",
    env: {
      ...process.env,
      ARTIFACT_STORE_DRIVER: "fs",
      ARTIFACT_STORE_FS_ROOT: ctx.store,
      ARTIFACT_BUILD_DIR: ctx.build,
      ARTIFACT_URL_PREFIX: "https://cdn.example/artifacts/sha256",
      ARTIFACT_RELEASE_ID: "test-release",
      ...extraEnv,
    },
  });
}

test("filesystem store publishes immutably and GC writes state plus an audit log", async (t) => {
  const ctx = await fixture(t);
  const first = runStore(ctx, "publish");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).objects_created, 2);
  const second = runStore(ctx, "publish");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).objects_existing, 2);
  await access(join(ctx.store, "artifacts", "releases", "test-release.json"));

  const changed = { ...ctx.manifest, created_from: "mutated" };
  await writeFile(join(ctx.build, "sha256", `${ctx.hex}.json`), `${JSON.stringify(changed)}\n`);
  const immutable = runStore(ctx, "publish");
  assert.notEqual(immutable.status, 0);
  assert.match(immutable.stderr, /不可变对象已存在但内容不一致/);
  await writeFile(join(ctx.build, "sha256", `${ctx.hex}.json`), `${JSON.stringify(ctx.manifest)}\n`);

  const emptyIndex = { schema_version: "1", artifacts: [] };
  await writeFile(join(ctx.store, "artifacts", "index.json"), `${JSON.stringify(emptyIndex)}\n`);
  await mkdir(join(ctx.store, "artifacts", "gc"), { recursive: true });
  await writeFile(join(ctx.store, "artifacts", "gc", "state.json"), `${JSON.stringify({
    schema_version: "1",
    artifacts: { [ctx.hex]: { unreferenced_since: "2020-01-01T00:00:00Z" } },
  })}\n`);
  const gc = runStore(ctx, "gc", { ARTIFACT_RELEASE_ID: "" }, "--apply");
  assert.equal(gc.status, 0, gc.stderr);
  assert.equal(JSON.parse(gc.stdout).eligible_artifacts, 1);
  await assert.rejects(access(join(ctx.store, "artifacts", "sha256", `${ctx.hex}.skill`)));
  const state = JSON.parse(await readFile(join(ctx.store, "artifacts", "gc", "state.json"), "utf8"));
  assert.deepEqual(state.artifacts, {});
  const runs = await readdir(join(ctx.store, "artifacts", "gc", "runs"));
  assert.equal(runs.length, 1);
});
