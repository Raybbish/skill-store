"use client";
import type { ReactNode } from "react";
import { trackInstall } from "@/lib/analytics";
import { postReceipt } from "@/lib/receipts";

/**
 * 下载链接(统一埋点):点击 = 行为埋点 install 事件(ADR 0013,只攒不花)
 * + 安装回执(ADR 0017 砖一,install_receipts)。服务端组件可直接使用。
 */
export default function DlLink({
  id, href, download, contentHash, children,
}: {
  id: string; href: string; download: string; contentHash?: string; children: ReactNode;
}) {
  return (
    <a
      className="cp"
      href={href}
      download={download}
      onClick={() => {
        trackInstall(id);
        void postReceipt(id, "download", contentHash); // fire-and-forget,不阻塞下载
      }}
    >
      {children}
    </a>
  );
}
