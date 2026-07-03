"use client";
import { useState } from "react";
import type { ThreadVM } from "@/lib/community";
import ThreadRow from "@/components/ThreadRow";

type Tab = "reviews" | "help" | "challenge" | "show";

export default function SkillCommunity({ help, challenge, show }: { help: ThreadVM[]; challenge: ThreadVM[]; show: ThreadVM[] }) {
  const [tab, setTab] = useState<Tab>("reviews");
  const empty = (msg: string) => <div className="empty">{msg}</div>;

  return (
    <>
      <div className="sec-title">社区<small>评价需已验证安装 · 问答绑版本 · 评测可复现挑战</small></div>
      <div className="ctabs">
        <button className={`ctab ${tab === "reviews" ? "on" : ""}`} onClick={() => setTab("reviews")}>评价占位</button>
        <button className={`ctab ${tab === "help" ? "on" : ""}`} onClick={() => setTab("help")}>求助 {help.length}</button>
        <button className={`ctab ${tab === "challenge" ? "on" : ""}`} onClick={() => setTab("challenge")}>评测挑战 {challenge.length}</button>
        <button className={`ctab ${tab === "show" ? "on" : ""}`} onClick={() => setTab("show")}>晒用法 {show.length}</button>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 10 }}>
        {tab === "reviews" && (
          <div className="review-box" style={{ marginTop: 0 }}>
            🔎 <b>平台审计摘要</b>:已通过 L1 签名 / L2 五因子 / L3 意图三层审计与人工复核,权限见上。冷启动期评价位由审计摘要占位;仅「已验证安装」用户可评价,评测走可复现协议(开发中),成熟后并入带元数据的跑分摘要。
          </div>
        )}
        {tab === "help" && (help.length ? help.map((t, i) => <ThreadRow vm={t} key={i} />) : empty("还没有求助帖 · 遇到问题可发起提问(需登录)"))}
        {tab === "challenge" && (
          <>
            <div className="review-box" style={{ marginTop: 0, marginBottom: challenge.length ? 10 : 0 }}>
              🧪 <b>可复现挑战</b>:装好后运行 <code>npm run eval</code> 复跑货架分,提交你的 runner / 模型元数据或失败案例——分数可复现、可挑战。
            </div>
            {challenge.length ? challenge.map((t, i) => <ThreadRow vm={t} key={i} />) : empty("还没有评测挑战 · 来当第一个复现者")}
          </>
        )}
        {tab === "show" && (show.length ? show.map((t, i) => <ThreadRow vm={t} key={i} />) : empty("还没有人晒用法 · 分享你的第一个"))}
      </div>
    </>
  );
}
