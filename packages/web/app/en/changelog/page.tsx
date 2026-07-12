import ChangelogView from "../../changelog/ChangelogView";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "Updates · oh-my-skill",
  description: "Weekly store updates: new arrivals, releases and removals.",
  alternates: langAlternates("/changelog/", "en"),
};

export default function ChangelogEn() {
  return <ChangelogView locale="en" />;
}
