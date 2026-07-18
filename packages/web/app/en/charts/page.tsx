"use client";
import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/** Charts merged into the home page (ADR 0034): thin shell keeps old links alive. */
export default function ChartsRedirectEn() {
  const tt = useT();
  useEffect(() => {
    window.location.replace("/en/");
  }, []);
  return <div className="empty">{tt("browse.redirect")}</div>;
}
