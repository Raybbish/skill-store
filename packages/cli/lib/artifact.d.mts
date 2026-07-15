export const ARTIFACT_WRITER: "oms-deterministic-zip-v1";
export class ArtifactError extends Error {}
export interface ArtifactDirectory { root: string; name: string }
export function createDeterministicZip(directories: ArtifactDirectory[]): Promise<Buffer>;
export function createDeterministicSkillArtifact(skillDir: string, skillName: string): Promise<Buffer>;
export function artifactSha256(bytes: Uint8Array): string;
export function extractSkillArtifact(bytes: Uint8Array, destination: string, expectedRoot: string): Promise<string>;
