import ChartsView from "../../charts/ChartsView";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "Charts · oh-my-skill",
  description: "New arrivals by day, plus trending skills.",
  alternates: langAlternates("/charts/", "en"),
};

export default function ChartsEn() {
  return <ChartsView locale="en" />;
}
