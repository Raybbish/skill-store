/**
 * Build reproducible, content-addressed .skill artifacts (ADR 0029).
 *
 * Eligible input is deliberately strict: hosting=mirrored, mirror_complete=true,
 * a complete mirror directory, and a mirror source hash equal to catalog content_hash.
 * Any eligible artifact failure aborts the build; deployment must never silently omit it.
 *
 * Outputs:
 *   public/artifacts/sha256/<artifact_sha256 hex>.skill
 *   public/artifacts/sha256/<artifact_sha256 hex>.json
 *   public/artifacts/index.json
 *   public/dl/packs/<pack>.zip (deterministic convenience bundle)
 *
 * Tests/deploys may redirect inputs/outputs with PACK_CATALOG, PACK_PACKS,
 * PACK_OUT, PACK_ARTIFACT_OUT and PACK_ARTIFACT_INDEX_OUT. The optional first
 * argument limits artifact subjects.
 */
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  SOURCE_HASH_ALGORITHM,
  SOURCE_HASH_EXCLUDES,
  isSha256,
  sourceContentHashDirectory,
} from "../packages/cli/lib/content-hash.mjs";
import {
  ARTIFACT_WRITER,
  artifactSha256,
  createDeterministicSkillArtifact,
  createDeterministicZip,
} from "../packages/cli/lib/artifact.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = resolve(process.env.PACK_CATALOG || join(ROOT, "catalog", "skills"));
const PACKS = resolve(process.env.PACK_PACKS || join(ROOT, "catalog", "packs"));
const DL_OUT = resolve(process.env.PACK_OUT || join(ROOT, "packages", "web", "public", "dl"));
const ARTIFACT_OUT = resolve(process.env.PACK_ARTIFACT_OUT || join(dirname(DL_OUT), "artifacts"));
const ARTIFACT_INDEX_OUT = resolve(process.env.PACK_ARTIFACT_INDEX_OUT || join(ARTIFACT_OUT, "index.json"));
const ARTIFACT_URL_PREFIX = (process.env.ARTIFACT_URL_PREFIX || "/artifacts/sha256").replace(/\/$/, "");
const LIMIT = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : Infinity;

const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const posixRelative = (from, to) => relative(from, to).split("\\").join("/");

async function atomicWrite(path, body) {
  await mkdir(dirname(path), { recursive: true });
  const temp = join(dirname(path), `.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, body);
    await rename(temp, path);
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
}

async function skillDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === "skill-report.json")) return [dir];
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "mirror") continue;
    out.push(...await skillDirs(join(dir, entry.name)));
  }
  return out;
}

if (!existsSync(CATALOG)) {
  console.log("pack-zips: 无 catalog,跳过");
  process.exit(0);
}

await rm(ARTIFACT_OUT, { recursive: true, force: true });
await rm(DL_OUT, { recursive: true, force: true });
await mkdir(join(ARTIFACT_OUT, "sha256"), { recursive: true });

const indexEntries = [];
const objects = new Map();
const bySkill = new Map();
let made = 0;
let ineligible = 0;
const candidates = [];
const preflightErrors = [];

for (const dir of await skillDirs(CATALOG)) {
  if (candidates.length >= LIMIT) break;
  const id = posixRelative(CATALOG, dir);
  try {
    const report = JSON.parse(await readFile(join(dir, "skill-report.json"), "utf8"));
    if (report.meta.hosting !== "mirrored" || report.meta.mirror_complete !== true) {
      ineligible++;
      continue;
    }
    if (report?.meta?.id !== id) throw new Error(`artifact identity mismatch:${id} vs ${report?.meta?.id ?? "<missing>"}`);
    if (!isSha256(report.meta.content_hash)) throw new Error(`artifact source hash 缺失或非法:${id}`);
    const mirror = join(dir, "mirror");
    if (!existsSync(mirror) || !(await stat(mirror)).isDirectory()) throw new Error(`完整镜像缺失:${id}`);
    const actualSourceHash = await sourceContentHashDirectory(mirror);
    if (actualSourceHash !== report.meta.content_hash) {
      throw new Error(`mirror/source hash 不一致:${id}:${report.meta.content_hash} vs ${actualSourceHash}`);
    }
    candidates.push({ id, mirror, actualSourceHash });
  } catch (error) {
    preflightErrors.push(error.message);
  }
}
if (preflightErrors.length) {
  throw new Error(`artifact preflight 失败 ${preflightErrors.length} 项:\n${preflightErrors.join("\n")}`);
}
if (process.env.PACK_PREFLIGHT_ONLY === "1") {
  console.log(`pack-zips preflight: ${candidates.length} 个完整镜像通过;${ineligible} 个非完整镜像跳过`);
  process.exit(0);
}

for (const { id, mirror, actualSourceHash } of candidates) {
  const leaf = id.split("/").at(-1);
  const body = await createDeterministicSkillArtifact(mirror, leaf);
  const hash = artifactSha256(body);
  const hex = hash.slice("sha256:".length);
  if (!objects.has(hash)) {
    await atomicWrite(join(ARTIFACT_OUT, "sha256", `${hex}.skill`), body);
    objects.set(hash, { artifact_sha256: hash, source_content_hash: actualSourceHash, size: body.length });
  } else if (objects.get(hash).source_content_hash !== actualSourceHash) {
    throw new Error(`同一 artifact 映射到不同 source hash:${hash}`);
  }
  const entry = {
    skill_id: id,
    source_content_hash: actualSourceHash,
    artifact_sha256: hash,
    artifact_url: `${ARTIFACT_URL_PREFIX}/${hex}.skill`,
    artifact_size: body.length,
  };
  indexEntries.push(entry);
  bySkill.set(id, entry);
  made++;
}

indexEntries.sort((a, b) => compareText(`${a.skill_id}\0${a.source_content_hash}`, `${b.skill_id}\0${b.source_content_hash}`));
for (const object of [...objects.values()].sort((a, b) => compareText(a.artifact_sha256, b.artifact_sha256))) {
  const manifest = {
    schema_version: "1",
    artifact_sha256: object.artifact_sha256,
    source_content_hash: object.source_content_hash,
    size: object.size,
    created_from: "catalog mirror",
    deterministic_zip: true,
    artifact_writer: ARTIFACT_WRITER,
    hash_policy: {
      source_algorithm: SOURCE_HASH_ALGORITHM,
      source_projection_excludes: SOURCE_HASH_EXCLUDES,
      artifact_covers: "complete .skill bytes including LICENSE.upstream and ZIP metadata",
    },
  };
  await atomicWrite(
    join(ARTIFACT_OUT, "sha256", `${object.artifact_sha256.slice("sha256:".length)}.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

const index = {
  schema_version: "1",
  artifact_writer: ARTIFACT_WRITER,
  hash_policy: {
    source_algorithm: SOURCE_HASH_ALGORITHM,
    source_projection_excludes: SOURCE_HASH_EXCLUDES,
    artifact_covers: "complete .skill bytes including LICENSE.upstream and ZIP metadata",
  },
  artifacts: indexEntries,
};
await atomicWrite(ARTIFACT_INDEX_OUT, `${JSON.stringify(index, null, 2)}\n`);

let packsMade = 0;
if (existsSync(PACKS)) {
  const packFiles = (await readdir(PACKS)).filter((name) => name.endsWith(".json")).sort(compareText);
  for (const file of packFiles) {
    const pack = JSON.parse(await readFile(join(PACKS, file), "utf8"));
    const ids = Array.isArray(pack.skills) ? pack.skills : [];
    if (!ids.length || !ids.every((id) => bySkill.has(id))) continue;
    const directories = ids.map((id) => ({ root: join(CATALOG, ...id.split("/"), "mirror"), name: id.split("/").at(-1) }));
    const body = await createDeterministicZip(directories);
    await atomicWrite(join(DL_OUT, "packs", `${pack.id}.zip`), body);
    packsMade++;
  }
}

console.log(
  `pack-zips: ${made} 个 subject → ${objects.size} 个不可变 .skill + ${packsMade} 个确定性整包;`
  + ` ${ineligible} 个非完整镜像跳过 → ${ARTIFACT_OUT}`,
);
