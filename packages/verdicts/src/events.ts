/** verdict.updated 事件(S0 = 进程内回调;S1 起映射 webhook,订阅方签名不变) */
import type { ScanVerdict } from "./types.ts";

type Listener = (v: ScanVerdict) => void;
const listeners: Listener[] = [];

export function onVerdictUpdated(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/** 服务内部用;消费方只订阅不发布 */
export function emitVerdictUpdated(v: ScanVerdict): void {
  for (const fn of listeners) fn(v);
}
