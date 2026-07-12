import ChartsView from "./ChartsView";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "榜单 · oh-my-skill",
  description: "新上架按收录日分组,热门前 20,一页看全。",
  alternates: langAlternates("/charts/", "zh"),
};

export default function Charts() {
  return <ChartsView locale="zh" />;
}
