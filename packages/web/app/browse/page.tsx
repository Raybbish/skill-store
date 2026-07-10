"use client";
import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/** 浏览已并入首页(新 IA):薄壳跳转保住外部旧链接与深链(?cat=&tag=&q=&repo=&pub=)。 */
export default function BrowseRedirect() {
  const tt = useT();
  useEffect(() => {
    window.location.replace("/" + window.location.search);
  }, []);
  return <div className="empty">{tt("browse.redirect")}</div>;
}
