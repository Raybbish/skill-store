import HomeServer from "../HomeServer";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "oh-my-skill — the Agent Skills store",
  description: "Browse, compare and install Agent Skills. Every install verifies content hashes file-by-file against upstream.",
  alternates: langAlternates("/", "en"),
};

export default function HomeEn() {
  return <HomeServer locale="en" />;
}
