import HomeServer from "./HomeServer";
import { langAlternates } from "@/lib/i18n";

export const metadata = { alternates: langAlternates("/", "zh") };

/** 首页(zh)。英文变体在 /en/(ADR 0022:商店的话跟语言走,商品保持原文)。 */
export default function Home() {
  return <HomeServer locale="zh" />;
}
