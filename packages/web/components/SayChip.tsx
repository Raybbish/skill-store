"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

/** 「装好后可以这样说」的示例话术:点击复制(ADR 0025;与 CopyCmd 同交互心智,形态更轻) */
export default function SayChip({ text }: { text: string }) {
  const tt = useT();
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    });
  };
  return (
    <button type="button" className={`say-chip${ok ? " ok" : ""}`} onClick={copy} title={tt("inst.copy")}>
      {ok ? tt("inst.copied") : `“${text}”`}
    </button>
  );
}
