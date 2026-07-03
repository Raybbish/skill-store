import type { Metadata } from "next";
import CommunityClient from "./CommunityClient";
import { BOARDS, allThreadVMs } from "@/lib/community";

export const metadata: Metadata = {
  title: "社区 — oh-my-skill",
  description: "围绕可复现信任的开发者社区:评价需已验证安装,评测分可复现可挑战,下架一律公开复盘。",
};

export default function CommunityPage() {
  return <CommunityClient boards={BOARDS} threads={allThreadVMs()} />;
}
