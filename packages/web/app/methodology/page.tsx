import MethodologyView from "./MethodologyView";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "收录 · oh-my-skill",
  description: "每个源收了多少、其余在哪,一页看全。",
  alternates: langAlternates("/methodology/", "zh"),
};

export default function Methodology() {
  return <MethodologyView locale="zh" />;
}
