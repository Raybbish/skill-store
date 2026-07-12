"use client";
/** 全局导航与页脚(ADR 0022):标签与链接前缀跟 locale 走——商店页链到对应语言变体,共享页保持单路由。 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { localePath } from "@/lib/i18n";
import { LocaleSwitch, useLocale, useT } from "@/lib/i18n/client";

/** 导航右侧账号位(ADR 0023 追记二):未登录「登录」,已登录显示身份;点击都进 /me。
 *  SSR/首帧恒「登录」(与静态输出一致),挂载后按会话订正——与 useLocale 同款防水合错配。
 *  延迟注册不破:这是状态展示,不是登录门。 */
function NavMe() {
  const tt = useT();
  const [who, setWho] = useState<string | null>(null);
  useEffect(() => {
    void getSession().then((s) => {
      if (!s) return;
      setWho(s.user.github_login ? `@${s.user.github_login}` : (s.user.email ?? "").split("@")[0] || null);
    });
  }, []);
  // /me 是单路由共享页,不加 locale 前缀
  return <Link href="/me/" className="nav-me" title={tt("me.title")}>{who ?? tt("nav.signIn")}</Link>;
}

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
      <NavMe />
    </nav>
  );
}

export function FooterLine() {
  const locale = useLocale();
  const tt = useT();
  return (
    <>
      oh-my-skill · <Link href="/privacy/">{tt("footer.privacy")}</Link> · <a href="mailto:contact@oh-my-skill.com">contact@oh-my-skill.com</a> · {tt("footer.tail")}
    </>
  );
}

/** 返回首页(跟 locale) */
export function BackHome() {
  const locale = useLocale();
  const tt = useT();
  return <Link href={localePath(locale, "/")} className="back">{tt("nav.back")}</Link>;
}
