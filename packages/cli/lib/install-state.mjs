import { open, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

export const STATE_SCHEMA_VERSION = "1";
export const ADAPTER_VERSION = "builtin-path-v1";
export const STATE_FILE = join(homedir(), ".oh-my-skill", "state.json");
const LOCK_FILE = `${STATE_FILE}.lock`;

export class StateError extends Error {
  constructor(message) {
    super(message);
    this.exitCode = 7;
  }
}

function emptyState() {
  return { schema_version: STATE_SCHEMA_VERSION, preferences: {}, installs: [] };
}

function validateState(value) {
  if (!value || value.schema_version !== STATE_SCHEMA_VERSION || !Array.isArray(value.installs)) {
    throw new StateError(`本机安装账本格式不受支持:${STATE_FILE};为避免覆盖数据已停止。`);
  }
  for (const entry of value.installs) {
    if (!entry || typeof entry.destination !== "string" || typeof entry.skill_id !== "string") {
      throw new StateError(`本机安装账本含无效条目:${STATE_FILE};为避免覆盖数据已停止。`);
    }
  }
  return value;
}

export async function readState() {
  try {
    return validateState(JSON.parse(await readFile(STATE_FILE, "utf8")));
  } catch (error) {
    if (error?.code === "ENOENT") return emptyState();
    if (error instanceof StateError) throw error;
    throw new StateError(`读取本机安装账本失败:${error.message}`);
  }
}

async function acquireLock() {
  await mkdir(dirname(LOCK_FILE), { recursive: true });
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const handle = await open(LOCK_FILE, "wx", 0o600);
      return async () => {
        await handle.close().catch(() => {});
        await rm(LOCK_FILE, { force: true }).catch(() => {});
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw new StateError(`创建安装账本锁失败:${error.message}`);
      try {
        const lock = await stat(LOCK_FILE);
        if (Date.now() - lock.mtimeMs > 30_000) {
          await rm(LOCK_FILE, { force: true });
          continue;
        }
      } catch { /* 锁恰好被另一个进程释放,进入下一次重试 */ }
      await new Promise((done) => setTimeout(done, 25 + attempt * 5));
    }
  }
  throw new StateError("本机安装账本正被另一个进程占用,请稍后重试。");
}

async function writeState(state) {
  const temp = join(dirname(STATE_FILE), `.state-${randomUUID()}.tmp`);
  try {
    await mkdir(dirname(STATE_FILE), { recursive: true });
    await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temp, STATE_FILE);
  } catch (error) {
    throw new StateError(`写入本机安装账本失败:${error.message}`);
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
}

async function updateState(mutator) {
  const release = await acquireLock();
  try {
    const state = await readState();
    const next = mutator(state) ?? state;
    validateState(next);
    await writeState(next);
    return next;
  } finally {
    await release();
  }
}

export async function findInstall(destination) {
  const target = resolve(destination);
  const state = await readState();
  return state.installs.find((entry) => resolve(entry.destination) === target) ?? null;
}

export async function upsertInstall(entry) {
  const target = resolve(entry.destination);
  return updateState((state) => {
    const installs = state.installs.filter((item) => resolve(item.destination) !== target);
    installs.push({ ...entry, destination: target });
    installs.sort((a, b) => a.destination.localeCompare(b.destination));
    return { ...state, installs };
  });
}

export async function removeInstall(destination) {
  const target = resolve(destination);
  return updateState((state) => ({
    ...state,
    installs: state.installs.filter((item) => resolve(item.destination) !== target),
  }));
}
