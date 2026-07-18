import BrowseServer from "../../browse/BrowseServer";
import { langAlternates } from "@/lib/i18n";

export const metadata = {
  title: "Browse · oh-my-skill",
  description: "Full catalog: search, categories, facet filters, sorting and pagination.",
  alternates: langAlternates("/browse/", "en"),
};

export default function BrowseEn() {
  return <BrowseServer locale="en" />;
}
