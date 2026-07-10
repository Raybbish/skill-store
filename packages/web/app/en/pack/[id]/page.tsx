import { readIdxPacks } from "@/lib/store-server";
import PackView from "../../../pack/[id]/PackView";

export function generateStaticParams() {
  return readIdxPacks().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = readIdxPacks().find((x) => x.id === id);
  return { title: `${p?.title ?? id} · oh-my-skill`, description: p?.tagline };
}

export default async function PackPageEn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackView id={id} locale="en" />;
}
