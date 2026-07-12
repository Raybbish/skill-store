import { readIdxPacks } from "@/lib/store-server";
import { langAlternates } from "@/lib/i18n";
import PackView from "./PackView";

export function generateStaticParams() {
  return readIdxPacks().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = readIdxPacks().find((x) => x.id === id);
  return { title: `${p?.title ?? id} · oh-my-skill`, description: p?.tagline, alternates: langAlternates(`/pack/${id}/`, "zh") };
}

export default async function PackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackView id={id} locale="zh" />;
}
