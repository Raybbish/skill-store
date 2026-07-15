import { createHash } from "node:crypto";

export const DEFAULT_ARTIFACT_PREFIX = "artifacts";
export const DEFAULT_RETENTION_DAYS = 180;
export const DEFAULT_RELEASE_RETENTION_DAYS = 30;

const HASH_RE = /^sha256:([0-9a-f]{64})$/;
const HEX_RE = /^[0-9a-f]{64}$/;

export function sha256Hex(body) {
  return createHash("sha256").update(body).digest("hex");
}

export function normalizePrefix(value = DEFAULT_ARTIFACT_PREFIX) {
  const prefix = String(value).replace(/^\/+|\/+$/g, "");
  if (!prefix || prefix.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`artifact prefix 非法:${JSON.stringify(value)}`);
  }
  return prefix;
}

export function hashHex(value, label = "artifact_sha256") {
  const match = HASH_RE.exec(String(value));
  if (!match) throw new Error(`${label} 非法:${JSON.stringify(value)}`);
  return match[1];
}

export function parseArtifactIndex(input, label = "artifact index") {
  let index;
  try {
    index = typeof input === "string" || Buffer.isBuffer(input) ? JSON.parse(String(input)) : input;
  } catch (error) {
    throw new Error(`${label} JSON 非法:${error.message}`);
  }
  if (!index || index.schema_version !== "1" || !Array.isArray(index.artifacts)) {
    throw new Error(`${label} schema 非法`);
  }
  const identities = new Set();
  for (const [position, entry] of index.artifacts.entries()) {
    if (!entry || typeof entry.skill_id !== "string" || !entry.skill_id) {
      throw new Error(`${label} artifacts[${position}].skill_id 非法`);
    }
    hashHex(entry.source_content_hash, `${label} artifacts[${position}].source_content_hash`);
    hashHex(entry.artifact_sha256, `${label} artifacts[${position}].artifact_sha256`);
    if (!Number.isSafeInteger(entry.artifact_size) || entry.artifact_size < 0) {
      throw new Error(`${label} artifacts[${position}].artifact_size 非法`);
    }
    if (typeof entry.artifact_url !== "string" || !entry.artifact_url) {
      throw new Error(`${label} artifacts[${position}].artifact_url 非法`);
    }
    const identity = `${entry.skill_id}\0${entry.source_content_hash}`;
    if (identities.has(identity)) throw new Error(`${label} subject 重复:${entry.skill_id}`);
    identities.add(identity);
  }
  return index;
}

export function referencedArtifactHexes(indexes) {
  const referenced = new Set();
  for (const [position, value] of indexes.entries()) {
    const index = parseArtifactIndex(value, `artifact index ${position + 1}`);
    for (const entry of index.artifacts) referenced.add(hashHex(entry.artifact_sha256));
  }
  return referenced;
}

export function parseGcState(input) {
  if (input == null) return { schema_version: "1", artifacts: {} };
  let state;
  try { state = typeof input === "string" || Buffer.isBuffer(input) ? JSON.parse(String(input)) : input; }
  catch (error) { throw new Error(`artifact GC state JSON 非法:${error.message}`); }
  if (!state || state.schema_version !== "1" || !state.artifacts || typeof state.artifacts !== "object" || Array.isArray(state.artifacts)) {
    throw new Error("artifact GC state schema 非法");
  }
  for (const [hex, record] of Object.entries(state.artifacts)) {
    if (!HEX_RE.test(hex) || !record || Number.isNaN(Date.parse(record.unreferenced_since))) {
      throw new Error(`artifact GC state 条目非法:${hex}`);
    }
  }
  return state;
}

function tombstoneHex(value) {
  const raw = String(value).trim();
  if (HEX_RE.test(raw)) return raw;
  return hashHex(raw, "tombstone hash");
}

/**
 * Plan auditable retention without trusting object upload time as orphan age.
 * State records the first successful GC run that observed an artifact unreferenced.
 */
export function planArtifactGc({
  objects,
  indexes,
  state,
  tombstones = [],
  prefix = DEFAULT_ARTIFACT_PREFIX,
  now = new Date(),
  retentionDays = DEFAULT_RETENTION_DAYS,
}) {
  const normalizedPrefix = normalizePrefix(prefix);
  const current = parseGcState(state);
  const referenced = referencedArtifactHexes(indexes);
  const tombstoned = new Set(tombstones.filter((value) => String(value).trim()).map(tombstoneHex));
  for (const hex of tombstoned) {
    if (referenced.has(hex)) throw new Error(`tombstone 仍被当前或 pinned release 引用:${hex}`);
  }
  if (!Number.isInteger(retentionDays) || retentionDays < 1) throw new Error(`retention days 非法:${retentionDays}`);
  const nowDate = new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error(`GC 时间非法:${now}`);
  const nowIso = nowDate.toISOString();
  const cutoffMs = retentionDays * 24 * 60 * 60 * 1000;
  const recentCutoff = nowDate.getTime() - 30 * 24 * 60 * 60 * 1000;
  const observed = new Map();
  let objectCount = 0;
  let totalBytes = 0;
  let monthAddedBytes = 0;
  const escapedPrefix = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const objectPattern = new RegExp(`^${escapedPrefix}/sha256/([0-9a-f]{64})\\.(skill|json)$`);

  for (const object of objects) {
    const key = object.key ?? object.Key;
    const size = Number(object.size ?? object.Size ?? 0);
    if (typeof key !== "string") continue;
    const match = objectPattern.exec(key);
    if (!match) continue;
    if (!Number.isFinite(size) || size < 0) throw new Error(`对象大小非法:${key}`);
    const modified = new Date(object.lastModified ?? object.LastModified ?? 0).getTime();
    objectCount++;
    totalBytes += size;
    if (Number.isFinite(modified) && modified >= recentCutoff) monthAddedBytes += size;
    const record = observed.get(match[1]) ?? { keys: [], bytes: 0, extensions: new Set() };
    record.keys.push(key);
    record.bytes += size;
    record.extensions.add(match[2]);
    observed.set(match[1], record);
  }

  for (const hex of referenced) {
    const record = observed.get(hex);
    if (!record || !record.extensions.has("skill") || !record.extensions.has("json")) {
      throw new Error(`引用制品对象不完整:${hex}`);
    }
  }

  const nextArtifacts = {};
  const deleteKeys = [];
  const deleteHexes = [];
  let orphanArtifacts = 0;
  let newlyOrphaned = 0;
  let retainedOrphans = 0;
  let tombstoneArtifacts = 0;

  for (const hex of [...observed.keys()].sort()) {
    if (referenced.has(hex)) continue;
    orphanArtifacts++;
    const existing = current.artifacts[hex];
    const unreferencedSince = existing?.unreferenced_since ?? nowIso;
    if (!existing) newlyOrphaned++;
    const elapsed = nowDate.getTime() - Date.parse(unreferencedSince);
    const immediate = tombstoned.has(hex);
    if (immediate || elapsed >= cutoffMs) {
      if (immediate) tombstoneArtifacts++;
      deleteHexes.push(hex);
      deleteKeys.push(...observed.get(hex).keys);
    } else {
      retainedOrphans++;
      nextArtifacts[hex] = { unreferenced_since: unreferencedSince };
    }
  }

  deleteKeys.sort();
  return {
    deleteKeys,
    nextState: { schema_version: "1", updated_at: nowIso, artifacts: nextArtifacts },
    audit: {
      schema_version: "1",
      observed_at: nowIso,
      retention_days: retentionDays,
      referenced_artifacts: [...referenced].filter((hex) => observed.has(hex)).length,
      object_count: objectCount,
      artifact_count: observed.size,
      incomplete_artifacts: [...observed.values()].filter((record) => record.extensions.size !== 2).length,
      total_bytes: totalBytes,
      month_added_bytes: monthAddedBytes,
      orphan_artifacts: orphanArtifacts,
      newly_orphaned_artifacts: newlyOrphaned,
      retained_orphan_artifacts: retainedOrphans,
      eligible_artifacts: deleteHexes.length,
      eligible_objects: deleteKeys.length,
      tombstoned_artifacts: tombstoneArtifacts,
      delete_artifact_sha256: deleteHexes.map((hex) => `sha256:${hex}`),
      delete_keys: deleteKeys,
    },
  };
}

export function planReleaseGc({
  objects,
  pinnedReleases = [],
  prefix = DEFAULT_ARTIFACT_PREFIX,
  now = new Date(),
  retentionDays = DEFAULT_RELEASE_RETENTION_DAYS,
}) {
  const normalizedPrefix = normalizePrefix(prefix);
  if (!Number.isInteger(retentionDays) || retentionDays < 1) throw new Error(`release retention days 非法:${retentionDays}`);
  const nowDate = new Date(now);
  if (Number.isNaN(nowDate.getTime())) throw new Error(`release GC 时间非法:${now}`);
  const pinned = new Set(pinnedReleases);
  const cutoffMs = retentionDays * 24 * 60 * 60 * 1000;
  const escapedPrefix = normalizedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}/releases/([A-Za-z0-9._-]{1,128})\\.json$`);
  const deleteKeys = [];
  let snapshots = 0;
  let pinnedSnapshots = 0;
  for (const object of objects) {
    const key = object.key ?? object.Key;
    if (typeof key !== "string") continue;
    const match = pattern.exec(key);
    if (!match) continue;
    snapshots++;
    if (pinned.has(match[1])) {
      pinnedSnapshots++;
      continue;
    }
    const modified = new Date(object.lastModified ?? object.LastModified ?? 0).getTime();
    if (Number.isFinite(modified) && nowDate.getTime() - modified >= cutoffMs) deleteKeys.push(key);
  }
  deleteKeys.sort();
  return {
    deleteKeys,
    audit: {
      release_retention_days: retentionDays,
      release_snapshots: snapshots,
      pinned_release_snapshots: pinnedSnapshots,
      expired_release_snapshots: deleteKeys.length,
      delete_release_keys: deleteKeys,
    },
  };
}
