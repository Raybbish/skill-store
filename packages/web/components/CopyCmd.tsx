"use client";
import { useState } from "react";

/** 一行命令 + 复制按钮(包页全装命令用) */
export default function CopyCmd({ cmd }: { cmd: string }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    });
  };
  return (
    <div className="inst-cmd" style={{ marginTop: 18, maxWidth: 640 }}>
      <span className="cli" style={{ marginTop: 0 }}>$ {cmd}</span>
      <button className="cp" onClick={copy}>{ok ? "✓ 已复制" : "复制"}</button>
    </div>
  );
}
