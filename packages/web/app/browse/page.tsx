import BrowseServer from "./BrowseServer";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "浏览 · oh-my-skill",
  description: "全量目录:搜索、分类与分面筛选、排序与分页。",
  alternates: langAlternates("/browse/", "zh"),
};

/** 浏览页(zh)= 目录检索真身(ADR 0034:原首页迁入;旧壳方向反转,/ 带检索参数时由首页转发过来)。 */
export default function Browse() {
  return <BrowseServer locale="zh" />;
}
