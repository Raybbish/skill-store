"use client";
import { useState } from "react";
import type { Board, BoardId, ThreadVM } from "@/lib/community";
import ThreadRow from "@/components/ThreadRow";

export default function CommunityClient({ boards, threads }: { boards: Board[]; threads: ThreadVM[] }) {
  const [cur, setCur] = useState<BoardId>("help");
  const b = boards.find((x) => x.id === cur)!;
  const list = threads.filter((t) => t.board === cur);

  return (
    <>
      <div className="h2">社区</div>
      <div className="h2-sub">围绕可复现信任的开发者社区 · 评价需已验证安装,评测分可复现可挑战</div>

      <div className="board-grid">
        {boards.map((x) => (
          <button key={x.id} className={`board-card ${cur === x.id ? "on" : ""}`} onClick={() => setCur(x.id)}>
            <div className="bc-em">{x.em}</div>
            <div className="bc-n">{x.n}</div>
            <div className="bc-d">{x.d}</div>
            <div className="bc-c">{threads.filter((t) => t.board === x.id).length} 帖</div>
          </button>
        ))}
      </div>

      <div className="sec-title">{b.em} {b.n}<small>发帖需登录(原型未接账号层)</small></div>
      <div className="card" style={{ padding: "6px 14px" }}>
        {list.length ? list.map((t, i) => <ThreadRow vm={t} key={i} />) : <div className="empty">该板块暂无内容</div>}
      </div>

      {cur === "help" && (
        <div className="card" style={{ fontSize: 13, color: "var(--sub)" }}>
          🆘 <b style={{ color: "var(--ink)" }}>求助绑版本:</b>每条求助关联具体 skill 与版本,答案沉淀为该 skill 的使用知识库,可被搜索引擎索引。
        </div>
      )}
      {cur === "challenge" && (
        <div className="card" style={{ fontSize: 13, color: "var(--sub)" }}>
          🧪 <b style={{ color: "var(--ink)" }}>评测挑战怎么玩:</b>任何人都能用 <code>npm run eval</code> 复跑货架分数,提交 runner / 模型元数据与失败案例。分数可复现、可挑战——平台做赛道不做裁判。
        </div>
      )}
      {cur === "announce" && (
        <div className="card" style={{ fontSize: 13, color: "var(--sub)" }}>
          📢 <b style={{ color: "var(--ink)" }}>为什么公开复盘:</b>上架 skill 被确认恶意的数量目标恒为 0;一旦出现即公开下架并复盘。透明本身就是信任的一部分。
        </div>
      )}
    </>
  );
}
