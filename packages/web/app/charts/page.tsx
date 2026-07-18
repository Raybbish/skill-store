"use client";
import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/** 榜单已并入首页(ADR 0034):薄壳跳转保住旧链接与外部收藏。 */
export default function ChartsRedirect() {
  const tt = useT();
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return <div className="empty">{tt("browse.redirect")}</div>;
}
