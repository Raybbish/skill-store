"use client";
import Link from "next/link";
import type { ThreadVM } from "@/lib/community";

export default function ThreadRow({ vm }: { vm: ThreadVM }) {
  const inner = (
    <>
      <div className="th-main">
        <div className="th-title">
          {vm.flag && <span className={`tflag ${vm.flag.tone}`}>{vm.flag.text}</span>}
          <span>{vm.title}</span>
        </div>
        <div className="th-meta">{vm.skill ? vm.skill.id : "平台公告"} · {vm.author} · {vm.time}{vm.tag ? ` · #${vm.tag}` : ""}</div>
      </div>
      {vm.metric && <div className="th-metric">{vm.metric}</div>}
    </>
  );
  return vm.skill ? (
    <Link href={`/skill/${vm.skill.owner}/${vm.skill.repo}/${vm.skill.name}/`} className="thread">{inner}</Link>
  ) : (
    <div className="thread" style={{ cursor: "default" }}>{inner}</div>
  );
}
