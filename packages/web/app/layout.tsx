import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-display", display: "swap" });
const ui = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--f-ui", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--f-mono", display: "swap" });

export const metadata: Metadata = {
  title: "oh-my-skill — 可信的 Agent Skills 商店",
  description: "浏览、比较、一键安装 Agent Skills。每个 skill 带一个认证图标,点开可看它的审计流程与权限披露。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <div className="nav"><div className="nav-in">
          <Link href="/" className="logo"><span className="mk">◆</span>oh-my<em>-skill</em></Link>
          <nav className="tabs">
            <Link href="/">今日</Link>
            <Link href="/browse/">浏览</Link>
            <Link href="/charts/">榜单</Link>
            <Link href="/community/">社区</Link>
          </nav>
          <div className="nav-r"><Link href="/browse/">🔍</Link><Link href="/community/" className="new">＋ 发布</Link></div>
        </div></div>
        <div className="wrap">{children}</div>
        <footer>oh-my-skill · 审计报告随公开 catalog 仓可验证 · Agent Skills 认证商店</footer>
      </body>
    </html>
  );
}
