import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { chmod, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "fflate";

export const ARTIFACT_WRITER = "oms-deterministic-zip-v1";
const UTF8_FLAG = 0x0800;
const DOS_DATE_1980_01_01 = 0x0021;
const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 10_000;

export class ArtifactError extends Error {}

const comparePath = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(body) {
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function validateSegment(name, label = "ZIP path") {
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    throw new ArtifactError(`${label} 含非法路径段:${JSON.stringify(name)}`);
  }
}

async function collectDirectory(root, archiveRoot) {
  validateSegment(archiveRoot, "artifact root");
  const files = [];
  async function walk(absoluteDir, relativeDir) {
    const names = await readdir(absoluteDir);
    names.sort(comparePath);
    for (const name of names) {
      validateSegment(name);
      const absolutePath = join(absoluteDir, name);
      const relativePath = relativeDir ? `${relativeDir}/${name}` : name;
      const info = await lstat(absolutePath);
      if (info.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (info.isSymbolicLink()) {
        throw new ArtifactError(`确定性制品不接受符号链接:${archiveRoot}/${relativePath}`);
      } else if (info.isFile()) {
        files.push({
          name: `${archiveRoot}/${relativePath}`,
          body: await readFile(absolutePath),
          mode: info.mode & 0o111 ? 0o755 : 0o644,
        });
      } else {
        throw new ArtifactError(`确定性制品不接受特殊文件:${archiveRoot}/${relativePath}`);
      }
    }
  }
  await walk(root, "");
  return files;
}

function localHeader(entry) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(UTF8_FLAG, 6);
  header.writeUInt16LE(entry.method, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(DOS_DATE_1980_01_01, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.body.length, 22);
  header.writeUInt16LE(entry.nameBytes.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function centralHeader(entry) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(0x0314, 4); // Unix, ZIP 2.0
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(UTF8_FLAG, 8);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(DOS_DATE_1980_01_01, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressed.length, 20);
  header.writeUInt32LE(entry.body.length, 24);
  header.writeUInt16LE(entry.nameBytes.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(((0o100000 | entry.mode) << 16) >>> 0, 38);
  header.writeUInt32LE(entry.offset, 42);
  return header;
}

/** Build a sorted ZIP with fixed metadata. LICENSE.upstream is intentionally included. */
export async function createDeterministicZip(directories) {
  const roots = new Set();
  const files = [];
  for (const item of directories) {
    validateSegment(item.name, "artifact root");
    if (roots.has(item.name)) throw new ArtifactError(`ZIP 顶层目录重名:${item.name}`);
    roots.add(item.name);
    files.push(...await collectDirectory(item.root, item.name));
  }
  files.sort((a, b) => comparePath(a.name, b.name));
  if (!files.length) throw new ArtifactError("确定性制品没有可写文件");
  if (files.length > MAX_ENTRIES || files.length > 0xffff) throw new ArtifactError(`ZIP 条目过多:${files.length}`);

  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = Buffer.from(file.name, "utf8");
    // Node delegates deflate to the platform zlib build, whose byte stream may vary
    // between supported Node/OS combinations. Keep artifact bytes content-addressable
    // by using one lockfile-pinned, pure JavaScript writer everywhere.
    const compressed = Buffer.from(deflateSync(file.body, { level: 9 }));
    if (file.body.length > 0xffffffff || compressed.length > 0xffffffff) {
      throw new ArtifactError(`ZIP64 暂不支持:${file.name}`);
    }
    const entry = { ...file, nameBytes, compressed, method: 8, crc: crc32(file.body), offset };
    const local = localHeader(entry);
    localParts.push(local, nameBytes, compressed);
    offset += local.length + nameBytes.length + compressed.length;
    centralParts.push(centralHeader(entry), nameBytes);
  }
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

export async function createDeterministicSkillArtifact(skillDir, skillName) {
  return createDeterministicZip([{ root: skillDir, name: skillName }]);
}

export function artifactSha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function findEocd(buffer) {
  for (let i = buffer.length - 22, min = Math.max(0, buffer.length - 65_558); i >= min; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

function safeArchivePath(name, expectedRoot) {
  if (name.includes("\\") || name.includes("\0") || name.startsWith("/")) {
    throw new ArtifactError(`artifact 含不安全路径:${JSON.stringify(name)}`);
  }
  const parts = name.split("/");
  if (parts.length < 2 || parts[0] !== expectedRoot || parts.some((part) => !part || part === "." || part === "..")) {
    throw new ArtifactError(`artifact 顶层目录或路径非法:${JSON.stringify(name)}`);
  }
  return parts.slice(1).join("/");
}

/** Strict extractor for store-produced .skill files; returns the extracted top-level directory. */
export async function extractSkillArtifact(bytes, destination, expectedRoot) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  validateSegment(expectedRoot, "expected artifact root");
  if (buffer.length > MAX_ARCHIVE_BYTES) throw new ArtifactError(`artifact 过大:${buffer.length}`);
  if (buffer.length < 22) throw new ArtifactError("artifact 不是有效 ZIP");
  const eocd = findEocd(buffer);
  if (eocd < 0) throw new ArtifactError("artifact 缺 ZIP central directory");
  const count = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  let offset = buffer.readUInt32LE(eocd + 16);
  if (!count || count > MAX_ENTRIES || offset + centralSize > eocd) throw new ArtifactError("artifact central directory 越界");

  const files = [];
  const seen = new Set();
  let total = 0;
  for (let index = 0; index < count; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new ArtifactError(`artifact central entry ${index} 非法`);
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const expectedCrc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.length) throw new ArtifactError("artifact central entry 越界");
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    offset = end;
    if (name.endsWith("/")) continue;
    if (flags & 1) throw new ArtifactError("artifact 不接受加密 ZIP entry");
    if (method !== 0 && method !== 8) throw new ArtifactError(`artifact 压缩方法不支持:${method}`);
    const unixMode = externalAttributes >>> 16;
    if ((unixMode & 0o170000) === 0o120000) throw new ArtifactError(`artifact 不接受符号链接:${name}`);
    const relativePath = safeArchivePath(name, expectedRoot);
    if (seen.has(relativePath)) throw new ArtifactError(`artifact 路径重复:${relativePath}`);
    seen.add(relativePath);

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new ArtifactError(`artifact local header 非法:${name}`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const localName = buffer.subarray(localOffset + 30, localOffset + 30 + localNameLength).toString("utf8");
    if (localName !== name) throw new ArtifactError(`artifact local/central 路径不一致:${name}`);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > buffer.length) throw new ArtifactError(`artifact 数据越界:${name}`);
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let body;
    try { body = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed); }
    catch (error) { throw new ArtifactError(`artifact 解压失败:${name}:${error.message}`); }
    if (body.length !== size || crc32(body) !== expectedCrc) throw new ArtifactError(`artifact entry 校验失败:${name}`);
    total += body.length;
    if (total > MAX_EXTRACTED_BYTES) throw new ArtifactError(`artifact 解包后过大:${total}`);
    files.push({ relativePath, body, mode: unixMode & 0o111 ? 0o755 : 0o644 });
  }
  if (!files.some((file) => file.relativePath === "SKILL.md")) throw new ArtifactError("artifact 缺少 SKILL.md");
  for (const file of files) {
    for (let slash = file.relativePath.indexOf("/"); slash >= 0; slash = file.relativePath.indexOf("/", slash + 1)) {
      if (seen.has(file.relativePath.slice(0, slash))) throw new ArtifactError(`artifact 文件/目录冲突:${file.relativePath}`);
    }
  }

  const root = join(destination, expectedRoot);
  await mkdir(root, { recursive: true });
  for (const file of files) {
    const output = join(root, ...file.relativePath.split("/"));
    await mkdir(join(output, ".."), { recursive: true });
    await writeFile(output, file.body, { mode: file.mode });
    await chmod(output, file.mode).catch(() => {});
  }
  return root;
}
