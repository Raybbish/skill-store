"use client";
/**
 * i18n 客户端侧(ADR 0022):
 * - useLocale:路径 /en/* 优先(商店页双路由,SSR 即正确);共享页(详情/分类/发布者)读偏好
 *   (localStorage oms_locale,默认 zh),切换经自定义事件即时生效,不刷新。
 * - L:服务端共享页的双语内联件(zh/en 两串就地给,不进词典——单路由页的 chrome 由它客户端切换)。
 * - LocaleSwitch:导航切换器。商店页 = 跳转对应 /en/ 路由(同时记偏好);共享页 = 原地切偏好。
 * - HtmlLang:按 locale 修正 <html lang>(根 layout 静态 zh-CN,客户端订正)。
 */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { t, type Locale, type MsgKey } from "./index";

const KEY = "oms_locale";
const EVT = "oms:locale";

function prefLocale(): Locale {
  try { return (localStorage.getItem(KEY) as Locale) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

export function setPreferredLocale(l: Locale): void {
  try { localStorage.setItem(KEY, l); } catch { /* 忽略 */ }
  window.dispatchEvent(new Event(EVT));
}

export function useLocale(): Locale {
  const pathname = usePathname() ?? "/";
  const fromPath: Locale | null = pathname === "/en" || pathname.startsWith("/en/") ? "en" : null;
  const [pref, setPref] = useState<Locale>("zh"); // SSR/首帧 = zh,与静态输出一致(共享页水合后按偏好订正)
  useEffect(() => {
    const read = () => setPref(prefLocale());
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  return fromPath ?? pref;
}

/** 词典取词(客户端组件用) */
export function useT() {
  const locale = useLocale();
  return (key: MsgKey, vars?: Record<string, string | number>) => t(locale, key, vars);
}

/** 共享页内联双语件:SSR 输出 zh(与静态一致),en 偏好时水合后切换 */
export function L({ zh, en }: { zh: ReactNode; en: ReactNode }) {
  const locale = useLocale();
  return <>{locale === "en" ? en : zh}</>;
}

/** 商店页路径 ↔ /en/ 对应关系 */
function counterpart(pathname: string, target: Locale): string {
  const bare = pathname === "/en" || pathname === "/en/" ? "/" : pathname.replace(/^\/en\//, "/");
  return target === "en" ? (bare === "/" ? "/en/" : `/en${bare}`) : bare;
}
/** 有 /en/ 变体的商店页(共享页原地切,不跳转) */
const STORE_RE = /^(\/en)?\/((charts|changelog|methodology|pack)(\/|$)|$)/;

export function LocaleSwitch() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const locale = useLocale();
  const pick = (l: Locale) => {
    if (l === locale) return;
    setPreferredLocale(l);
    if (STORE_RE.test(pathname)) router.push(counterpart(pathname, l));
  };
  return (
    <span className="lang-sw" role="group" aria-label="Language">
      <button className={locale === "zh" ? "on" : ""} onClick={() => pick("zh")}>中</button>
      <span aria-hidden="true">/</span>
      <button className={locale === "en" ? "on" : ""} onClick={() => pick("en")}>EN</button>
    </span>
  );
}

/** <html lang> 客户端订正(静态导出单 layout,无法按路由变 lang) */
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
  }, [locale]);
  return null;
}
