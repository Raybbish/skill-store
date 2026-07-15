import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, mkdir, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SOURCE_HASH_ALGORITHM,
  gitBlobSha1,
  sourceContentHashDirectory,
  sourceContentHashFromRecords,
} from "../lib/content-hash.mjs";
import {
  artifactSha256,
  createDeterministicSkillArtifact,
  extractSkillArtifact,
} from "../lib/artifact.mjs";

const PACK = fileURLToPath(new URL("../../../scripts/pack-zips.mjs", import.meta.url));
const SKILL = "---\nname: demo\ndescription: deterministic fixture\n---\n\n# Demo\n";
const LICENSE_A = "MIT evidence A\n";
const LICENSE_B = "MIT evidence B\n";

async function tempFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "oms-artifact-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const mirror = join(root, "catalog", "skills", "owner", "repo", "demo", "mirror");
  await mkdir(mirror, { recursive: true });
  await writeFile(join(mirror, "SKILL.md"), SKILL);
  await writeFile(join(mirror, "LICENSE.upstream"), LICENSE_A);
  return { root, mirror };
}

test("shared source hash excludes LICENSE.upstream while artifact hash covers it", async (t) => {
  const ctx = await tempFixture(t);
  const expected = sourceContentHashFromRecords([{ path: "SKILL.md", blobSha: gitBlobSha1(SKILL) }]);
  assert.equal(await sourceContentHashDirectory(ctx.mirror), expected);

  const first = await createDeterministicSkillArtifact(ctx.mirror, "demo");
  assert.equal(artifactSha256(first), "sha256:292746c7b3ae6027d69b34de3fc314a91827972c66fb572d475e77a9de55863f");
  await writeFile(join(ctx.mirror, "LICENSE.upstream"), LICENSE_B);
  assert.equal(await sourceContentHashDirectory(ctx.mirror), expected);
  const second = await createDeterministicSkillArtifact(ctx.mirror, "demo");
  assert.notEqual(artifactSha256(first), artifactSha256(second));
});

test("deterministic artifact ignores mtimes and round-trips through the strict extractor", async (t) => {
  const ctx = await tempFixture(t);
  await mkdir(join(ctx.mirror, "scripts"));
  await writeFile(join(ctx.mirror, "scripts", "run.sh"), "#!/bin/sh\necho demo\n");
  await chmod(join(ctx.mirror, "scripts", "run.sh"), 0o755);
  const first = await createDeterministicSkillArtifact(ctx.mirror, "demo");
  await utimes(join(ctx.mirror, "SKILL.md"), new Date("2020-01-01T00:00:00Z"), new Date("2030-01-01T00:00:00Z"));
  const second = await createDeterministicSkillArtifact(ctx.mirror, "demo");
  assert.deepEqual(first, second);

  const extracted = join(ctx.root, "extracted");
  await extractSkillArtifact(first, extracted, "demo");
  assert.equal(await readFile(join(extracted, "demo", "SKILL.md"), "utf8"), SKILL);
  assert.equal(await readFile(join(extracted, "demo", "LICENSE.upstream"), "utf8"), LICENSE_A);
  assert.equal(await readFile(join(extracted, "demo", "scripts", "run.sh"), "utf8"), "#!/bin/sh\necho demo\n");
  assert.equal((await stat(join(extracted, "demo", "scripts", "run.sh"))).mode & 0o777, 0o755);
  assert.equal(await sourceContentHashDirectory(join(extracted, "demo")), await sourceContentHashDirectory(ctx.mirror));
  await assert.rejects(extractSkillArtifact(first, join(ctx.root, "wrong-root"), "other"), /顶层目录/);
});

async function writeCatalogReport(ctx, hash) {
  const reportPath = join(dirname(ctx.mirror), "skill-report.json");
  await writeFile(reportPath, `${JSON.stringify({
    schema_version: "2",
    meta: {
      id: "owner/repo/demo",
      name: "demo",
      hosting: "mirrored",
      mirror_complete: true,
      content_hash: hash,
    },
  }, null, 2)}\n`);
}

function runPack(ctx, suffix) {
  const artifactOut = join(ctx.root, `out-${suffix}`, "artifacts");
  const dlOut = join(ctx.root, `out-${suffix}`, "dl");
  const result = spawnSync(process.execPath, [PACK], {
    cwd: ctx.root,
    encoding: "utf8",
    env: {
      ...process.env,
      PACK_CATALOG: join(ctx.root, "catalog", "skills"),
      PACK_PACKS: join(ctx.root, "catalog", "packs"),
      PACK_ARTIFACT_OUT: artifactOut,
      PACK_OUT: dlOut,
    },
  });
  return { result, artifactOut };
}

test("pack-zips emits the same content-addressed artifact and manifest on repeated builds", async (t) => {
  const ctx = await tempFixture(t);
  const hash = await sourceContentHashDirectory(ctx.mirror);
  await writeCatalogReport(ctx, hash);
  const first = runPack(ctx, "a");
  assert.equal(first.result.status, 0, first.result.stderr);
  await utimes(join(ctx.mirror, "LICENSE.upstream"), new Date("2019-01-01T00:00:00Z"), new Date("2040-01-01T00:00:00Z"));
  const second = runPack(ctx, "b");
  assert.equal(second.result.status, 0, second.result.stderr);

  const indexA = JSON.parse(await readFile(join(first.artifactOut, "index.json"), "utf8"));
  const indexB = JSON.parse(await readFile(join(second.artifactOut, "index.json"), "utf8"));
  assert.deepEqual(indexA, indexB);
  assert.equal(indexA.hash_policy.source_algorithm, SOURCE_HASH_ALGORITHM);
  assert.equal(indexA.artifacts.length, 1);
  const entry = indexA.artifacts[0];
  const hex = entry.artifact_sha256.slice(7);
  const artifactA = await readFile(join(first.artifactOut, "sha256", `${hex}.skill`));
  const artifactB = await readFile(join(second.artifactOut, "sha256", `${hex}.skill`));
  assert.deepEqual(artifactA, artifactB);
  assert.equal(artifactSha256(artifactA), entry.artifact_sha256);
  const manifest = JSON.parse(await readFile(join(first.artifactOut, "sha256", `${hex}.json`), "utf8"));
  assert.equal(manifest.artifact_sha256, entry.artifact_sha256);
  assert.deepEqual(manifest.subjects, [{ skill_id: "owner/repo/demo", source_content_hash: hash }]);
});

test("pack-zips fails loudly when a complete mirror drifts from the catalog hash", async (t) => {
  const ctx = await tempFixture(t);
  await writeCatalogReport(ctx, `sha256:${"0".repeat(64)}`);
  const { result, artifactOut } = runPack(ctx, "bad");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mirror\/source hash 不一致/);
  await assert.rejects(readFile(join(artifactOut, "index.json"), "utf8"));
});
