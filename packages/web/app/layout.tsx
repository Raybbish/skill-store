import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Manrope, IBM_Plex_Mono } from "next/font/google";
import { NavTabs, FooterLine } from "@/components/Chrome";
import { HtmlLang } from "@/lib/i18n/client";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-display", display: "swap" });
const ui = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--f-ui", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--f-mono", display: "swap" });

export const metadata: Metadata = {
  title: "oh-my-skill — 可信的 Agent Skills 商店",
  description: "浏览、比较、一键安装 Agent Skills。安装时逐文件校验内容哈希,与上游一致才落盘。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 静态导出单 layout,lang 由 HtmlLang 按 locale 客户端订正(/en/* 或用户偏好 → en)
    <html lang="zh-CN" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <HtmlLang />
        <div className="nav"><div className="nav-in">
          <Link href="/" className="logo"><span className="mk">◆</span>oh-my<em>-skill</em></Link>
          <NavTabs />
        </div></div>
        <div className="wrap">{children}</div>
        <footer><FooterLine /></footer>
      </body>
    </html>
  );
}
