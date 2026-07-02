import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Store — 可信的 Agent Skills 目录",
  description: "每个 skill 都经过三层安全审计与人工复核,权限行为结构化披露。已扫描,不等于保证安全——但我们把能查的都查了,并把证据给你看。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="nav">
          <div className="nav-inner">
            <Link href="/" className="logo">Skill<span>Store</span></Link>
            <span className="nav-note">M0 可信目录 · 审计报告全部公开可验证</span>
          </div>
        </div>
        <div className="wrap">{children}</div>
        <footer>已扫描 ≠ 保证安全:标签是披露,不是背书 · 审计数据与本站同源于公开 catalog 仓</footer>
      </body>
    </html>
  );
}
