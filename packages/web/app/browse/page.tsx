import { allSkills } from "@/lib/data";
import BrowseClient from "./BrowseClient";

export default function Browse() {
  return <BrowseClient skills={allSkills()} />;
}
