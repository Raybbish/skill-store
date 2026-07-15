#!/usr/bin/env node
/** Publish immutable .skill objects and run auditable 180-day retention (ADR 0029). */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  DEFAULT_ARTIFACT_PREFIX,
  DEFAULT_RELEASE_RETENTION_DAYS,
  DEFAULT_RETENTION_DAYS,
  hashHex,
  normalizePrefix,
  parseArtifactIndex,
  planArtifactGc,
  planReleaseGc,
  sha256Hex,
} from "./lib/artifact-store-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const command = args.shift();
const flags = new Set(args);
const allowedFlags = new Set(["--apply", "--dry-run", "--json"]);
for (const flag of flags) if (!allowedFlags.has(flag)) throw new Error(`未知参数:${flag}`);
if (!new Set(["publish", "gc", "inventory"]).has(command)) {
  throw new Error("用法:node scripts/artifact-store.mjs publish [--dry-run] | gc [--apply] | inventory [--json]");
}

const PREFIX = normalizePrefix(process.env.ARTIFACT_STORE_PREFIX || DEFAULT_ARTIFACT_PREFIX);
const CONCURRENCY = positiveInt(process.env.ARTIFACT_STORE_CONCURRENCY || "12", "ARTIFACT_STORE_CONCURRENCY");

function positiveInt(raw, label) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} 必须是正整数`);
  return value;
}

function envBoolean(raw, fallback = false) {
  if (raw == null || raw === "") return fallback;
  if (["1", "true", "yes"].includes(raw.toLowerCase())) return true;
  if (["0", "false", "no"].includes(raw.toLowerCase())) return false;
  throw new Error(`布尔环境变量非法:${raw}`);
}

function safeReleaseId(value) {
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(value)) throw new Error(`release id 非法:${JSON.stringify(value)}`);
  return value;
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const position = cursor++;
      if (position >= items.length) return;
      results[position] = await worker(items[position], position);
    }
  }));
  return results;
}

function isMissing(error) {
  return error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey" || error?.name === "NotFound";
}

function isPrecondition(error) {
  return error?.$metadata?.httpStatusCode === 412 || error?.name === "PreconditionFailed";
}

function contentType(key) {
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  if (key.endsWith(".skill")) return "application/zip";
  return "application/octet-stream";
}

class S3Store {
  constructor() {
    this.bucket = process.env.ARTIFACT_STORE_BUCKET;
    if (!this.bucket) throw new Error("缺 ARTIFACT_STORE_BUCKET");
    const endpoint = process.env.ARTIFACT_STORE_ENDPOINT || undefined;
    const accessKeyId = process.env.ARTIFACT_STORE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.ARTIFACT_STORE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) throw new Error("对象存储 access key / secret key 必须成对提供");
    this.client = new S3Client({
      region: process.env.ARTIFACT_STORE_REGION || (endpoint ? "auto" : "us-east-1"),
      endpoint,
      forcePathStyle: envBoolean(process.env.ARTIFACT_STORE_FORCE_PATH_STYLE),
      credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined,
    });
  }

  async get(key) {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }

  async put(key, body, { immutable = false, cacheControl = "no-cache" } = {}) {
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const bodySha = sha256Hex(bytes);
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentLength: bytes.length,
        ContentType: contentType(key),
        CacheControl: cacheControl,
        Metadata: { "oms-body-sha256": bodySha, "oms-schema": "1" },
        ...(immutable ? { IfNoneMatch: "*" } : {}),
      }));
      return "created";
    } catch (error) {
      if (!immutable || !isPrecondition(error)) throw error;
      const existing = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      if (Number(existing.ContentLength) !== bytes.length || existing.Metadata?.["oms-body-sha256"] !== bodySha) {
        throw new Error(`不可变对象已存在但内容元数据不一致:${key}`);
      }
      return "existing";
    }
  }

  async list(prefix) {
    const objects = [];
    let continuationToken;
    do {
      const response = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      objects.push(...(response.Contents ?? []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      })));
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
    return objects;
  }

  async delete(keys) {
    for (let offset = 0; offset < keys.length; offset += 1000) {
      const batch = keys.slice(offset, offset + 1000);
      const response = await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Quiet: true, Objects: batch.map((Key) => ({ Key })) },
      }));
      if (response.Errors?.length) {
        throw new Error(`对象删除部分失败:${response.Errors.map((item) => `${item.Key}:${item.Code}`).join(",")}`);
      }
    }
  }
}

class FilesystemStore {
  constructor() {
    const configured = process.env.ARTIFACT_STORE_FS_ROOT;
    if (!configured) throw new Error("filesystem driver 缺 ARTIFACT_STORE_FS_ROOT");
    this.root = resolve(configured);
  }

  path(key) {
    const output = resolve(this.root, ...key.split("/"));
    if (output !== this.root && !output.startsWith(`${this.root}/`)) throw new Error(`对象 key 越界:${key}`);
    return output;
  }

  async get(key) {
    try { return await readFile(this.path(key)); }
    catch (error) { if (error.code === "ENOENT") return null; throw error; }
  }

  async put(key, body, { immutable = false } = {}) {
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const output = this.path(key);
    if (immutable) {
      const existing = await this.get(key);
      if (existing) {
        if (!existing.equals(bytes)) throw new Error(`不可变对象已存在但内容不一致:${key}`);
        return "existing";
      }
    }
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, bytes);
    return "created";
  }

  async list(prefix) {
    const start = this.path(prefix);
    const objects = [];
    async function walk(dir, keyPrefix) {
      let entries;
      try { entries = await readdir(dir, { withFileTypes: true }); }
      catch (error) { if (error.code === "ENOENT") return; throw error; }
      for (const entry of entries) {
        const path = join(dir, entry.name);
        const key = `${keyPrefix}/${entry.name}`;
        if (entry.isDirectory()) await walk(path, key);
        else if (entry.isFile()) {
          const info = await stat(path);
          objects.push({ key, size: info.size, lastModified: info.mtime });
        }
      }
    }
    await walk(start, prefix);
    return objects;
  }

  async delete(keys) {
    await Promise.all(keys.map((key) => rm(this.path(key), { force: true })));
  }
}

function createStore() {
  const driver = process.env.ARTIFACT_STORE_DRIVER || "s3";
  if (driver === "s3") return new S3Store();
  if (driver === "fs") return new FilesystemStore();
  throw new Error(`ARTIFACT_STORE_DRIVER 不支持:${driver}`);
}

async function localPublishPlan() {
  const buildDir = resolve(process.env.ARTIFACT_BUILD_DIR || join(ROOT, "packages", "web", "public", "artifacts"));
  const indexFile = resolve(process.env.ARTIFACT_INDEX_FILE || join(buildDir, "index.json"));
  const indexBytes = await readFile(indexFile);
  const index = parseArtifactIndex(indexBytes, indexFile);
  const expectedUrlPrefix = (process.env.ARTIFACT_URL_PREFIX || "").replace(/\/$/, "");
  const hashes = new Map();
  for (const entry of index.artifacts) {
    const hex = hashHex(entry.artifact_sha256);
    if (expectedUrlPrefix && entry.artifact_url !== `${expectedUrlPrefix}/${hex}.skill`) {
      throw new Error(`artifact URL 与 ARTIFACT_URL_PREFIX 不一致:${entry.skill_id}`);
    }
    const record = hashes.get(hex) ?? { sourceHashes: new Set(), expectedSize: entry.artifact_size };
    if (record.expectedSize !== entry.artifact_size) throw new Error(`同一 artifact size 不一致:${hex}`);
    record.sourceHashes.add(entry.source_content_hash);
    hashes.set(hex, record);
  }

  const objects = [];
  for (const [hex, record] of [...hashes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (record.sourceHashes.size !== 1) throw new Error(`同一 artifact 映射到多个 source hash:${hex}`);
    const skill = await readFile(join(buildDir, "sha256", `${hex}.skill`));
    if (sha256Hex(skill) !== hex || skill.length !== record.expectedSize) throw new Error(`本地 artifact 校验失败:${hex}`);
    const manifest = await readFile(join(buildDir, "sha256", `${hex}.json`));
    let parsed;
    try { parsed = JSON.parse(String(manifest)); }
    catch (error) { throw new Error(`artifact manifest JSON 非法:${hex}:${error.message}`); }
    if (parsed.schema_version !== "1" || parsed.artifact_sha256 !== `sha256:${hex}`
      || parsed.source_content_hash !== [...record.sourceHashes][0] || parsed.size !== skill.length) {
      throw new Error(`artifact manifest 与 index 不一致:${hex}`);
    }
    objects.push({ key: `${PREFIX}/sha256/${hex}.skill`, body: skill });
    objects.push({ key: `${PREFIX}/sha256/${hex}.json`, body: manifest });
  }
  return { index, indexBytes, objects };
}

async function publish() {
  const plan = await localPublishPlan();
  const dryRun = flags.has("--dry-run");
  if (dryRun) return output({ mode: "dry-run", artifacts: plan.objects.length / 2, objects: plan.objects.length });
  const store = createStore();
  const results = await mapLimit(plan.objects, CONCURRENCY, (item) => store.put(item.key, item.body, {
    immutable: true,
    cacheControl: "public, max-age=31536000, immutable",
  }));
  const releaseId = process.env.ARTIFACT_RELEASE_ID;
  if (releaseId) {
    await store.put(`${PREFIX}/releases/${safeReleaseId(releaseId)}.json`, plan.indexBytes, {
      immutable: true,
      cacheControl: "public, max-age=31536000, immutable",
    });
  }
  await store.put(`${PREFIX}/index.json`, plan.indexBytes, {
    cacheControl: "public, max-age=60, must-revalidate",
  });
  return output({
    mode: "publish",
    artifacts: plan.objects.length / 2,
    objects_created: results.filter((result) => result === "created").length,
    objects_existing: results.filter((result) => result === "existing").length,
    release_id: releaseId || null,
  });
}

async function readTombstones() {
  const file = process.env.ARTIFACT_TOMBSTONES_FILE;
  if (!file) return [];
  const body = await readFile(resolve(file), "utf8");
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) throw new Error("必须是数组");
    return parsed;
  } catch (error) {
    if (body.trimStart().startsWith("[")) throw new Error(`tombstone 文件 JSON 非法:${error.message}`);
    return body.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  }
}

async function runGc() {
  const store = createStore();
  const currentBytes = await store.get(`${PREFIX}/index.json`);
  if (!currentBytes) throw new Error(`对象存储缺当前 index:${PREFIX}/index.json`);
  const indexes = [parseArtifactIndex(currentBytes, "current artifact index")];
  const pinned = (process.env.ARTIFACT_PINNED_RELEASES || "").split(",").map((item) => item.trim()).filter(Boolean);
  for (const releaseId of pinned) {
    const key = `${PREFIX}/releases/${safeReleaseId(releaseId)}.json`;
    const bytes = await store.get(key);
    if (!bytes) throw new Error(`pinned release index 缺失:${key}`);
    indexes.push(parseArtifactIndex(bytes, key));
  }
  const stateKey = `${PREFIX}/gc/state.json`;
  const state = await store.get(stateKey);
  const objects = await store.list(`${PREFIX}/sha256`);
  const releaseObjects = await store.list(`${PREFIX}/releases`);
  const retentionDays = positiveInt(process.env.ARTIFACT_RETENTION_DAYS || String(DEFAULT_RETENTION_DAYS), "ARTIFACT_RETENTION_DAYS");
  const releaseRetentionDays = positiveInt(
    process.env.ARTIFACT_RELEASE_RETENTION_DAYS || String(DEFAULT_RELEASE_RETENTION_DAYS),
    "ARTIFACT_RELEASE_RETENTION_DAYS",
  );
  const observedAt = new Date();
  const plan = planArtifactGc({
    objects,
    indexes,
    state,
    tombstones: await readTombstones(),
    prefix: PREFIX,
    retentionDays,
    now: observedAt,
  });
  const releasePlan = planReleaseGc({
    objects: releaseObjects,
    pinnedReleases: pinned,
    prefix: PREFIX,
    retentionDays: releaseRetentionDays,
    now: observedAt,
  });
  const apply = command === "gc" && flags.has("--apply");
  const audit = {
    ...plan.audit,
    ...releasePlan.audit,
    mode: apply ? "apply" : "dry-run",
    pinned_releases: pinned,
  };
  if (apply) {
    await store.delete([...plan.deleteKeys, ...releasePlan.deleteKeys]);
    await store.put(stateKey, jsonBytes(plan.nextState), { cacheControl: "no-store" });
    const runId = `${audit.observed_at.replace(/[:.]/g, "-")}-${randomUUID()}`;
    await store.put(`${PREFIX}/gc/runs/${runId}.json`, jsonBytes(audit), { immutable: true, cacheControl: "no-store" });
  }
  return output(audit);
}

function output(value) {
  if (flags.has("--json")) console.log(JSON.stringify(value));
  else console.log(JSON.stringify(value, null, 2));
  return value;
}

try {
  if (command === "publish") await publish();
  else await runGc();
} catch (error) {
  console.error(`artifact-store: ${error.message}`);
  process.exitCode = 1;
}
