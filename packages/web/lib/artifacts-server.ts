/** Build-time/server-only reader for the content-addressed artifact index. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ArtifactIndexEntry {
  skill_id: string;
  source_content_hash: string;
  artifact_sha256: string;
  artifact_url: string;
  artifact_size: number;
}

let CACHE: ArtifactIndexEntry[] | null = null;

function entries(): ArtifactIndexEntry[] {
  if (CACHE) return CACHE;
  let loaded: ArtifactIndexEntry[] = [];
  try {
    const index = JSON.parse(readFileSync(join(process.cwd(), "public/artifacts/index.json"), "utf8"));
    loaded = index?.schema_version === "1" && Array.isArray(index.artifacts) ? index.artifacts : [];
  } catch { /* web:index/predev may run before pack-zips; download controls simply stay hidden. */ }
  CACHE = loaded;
  return loaded;
}

export function artifactForSkill(skillId: string, sourceContentHash?: string | null): ArtifactIndexEntry | null {
  return entries().find((entry) =>
    entry.skill_id === skillId && (!sourceContentHash || entry.source_content_hash === sourceContentHash)) ?? null;
}
