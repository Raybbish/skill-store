"use client";
/** 全局导航与页脚(ADR 0022):标签与链接前缀跟 locale 走——商店页链到对应语言变体,共享页保持单路由。 */
import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { LocaleSwitch, useLocale, useT } from "@/lib/i18n/client";

export function NavTabs() {
  const locale = useLocale();
  const tt = useT();
  const p = (path: string) => localePath(locale, path);
  return (
    <nav className="tabs">
      <Link href={p("/")}>{tt("nav.home")}</Link>
      <Link href={p("/charts/")}>{tt("nav.charts")}</Link>
      <Link href={p("/talk/")}>{tt("nav.talk")}</Link>
      <Link href={p("/changelog/")}>{tt("nav.changelog")}</Link>
      <Link href={p("/methodology/")}>{tt("nav.methodology")}</Link>
      <LocaleSwitch />
    </nav>
  );
}

export function FooterLine() {
  const locale = useLocale();
  const tt = useT();
  return (
    <>
      oh-my-skill · {tt("footer.line")} · <Link href={localePath(locale, "/methodology/")}>{tt("footer.policy")}</Link> · {tt("footer.tail")}
    </>
  );
}

/** 返回首页(跟 locale) */
export function BackHome() {
  const locale = useLocale();
  const tt = useT();
  return <Link href={localePath(locale, "/")} className="back">{tt("nav.back")}</Link>;
}
