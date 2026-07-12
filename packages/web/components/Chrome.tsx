"use client";
/** 全局导航与页脚(ADR 0022):标签与链接前缀跟 locale 走——商店页链到对应语言变体,共享页保持单路由。 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/i18n";
import { LocaleSwitch, useLocale, useT } from "@/lib/i18n/client";

export function NavTabs() {
  const locale = useLocale();
  const tt = useT();
  const pathname = usePathname();
  const p = (path: string) => localePath(locale, path);
  // 当前页判定:首页要精确(/ 或 /en/),其余按前缀;详情/分类等共享页不点亮任何 tab
  const cur = (path: string) => {
    const href = p(path);
    const hit = path === "/" ? pathname === href : pathname.startsWith(href);
    return hit ? { "aria-current": "page" as const } : {};
  };
  return (
    <nav className="tabs">
      <Link href={p("/")} {...cur("/")}>{tt("nav.home")}</Link>
      <Link href={p("/charts/")} {...cur("/charts/")}>{tt("nav.charts")}</Link>
      <Link href={p("/changelog/")} {...cur("/changelog/")}>{tt("nav.changelog")}</Link>
      <Link href={p("/methodology/")} {...cur("/methodology/")}>{tt("nav.methodology")}</Link>
      <LocaleSwitch />
    </nav>
  );
}

export function FooterLine() {
  const locale = useLocale();
  const tt = useT();
  return (
    <>
      oh-my-skill · <Link href="/me/">{tt("me.title")}</Link> · <Link href="/privacy/">{tt("footer.privacy")}</Link> · <a href="mailto:contact@oh-my-skill.com">contact@oh-my-skill.com</a> · {tt("footer.tail")}
    </>
  );
}

/** 返回首页(跟 locale) */
export function BackHome() {
  const locale = useLocale();
  const tt = useT();
  return <Link href={localePath(locale, "/")} className="back">{tt("nav.back")}</Link>;
}
