import MethodologyView from "../../methodology/MethodologyView";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "Coverage · oh-my-skill",
  description: "What each source contributed and where the rest lives — one page.",
  alternates: langAlternates("/methodology/", "en"),
};

export default function MethodologyEn() {
  return <MethodologyView locale="en" />;
}
