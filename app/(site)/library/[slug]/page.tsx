import { notFound } from "next/navigation";
import { Listing, type SP } from "@/components/public/Listing";
import { getLibraries } from "@/lib/queries";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  const l = (await getLibraries()).find((x) => x.slug === slug);
  return { title: l?.name ?? "Library" };
}

export default async function LibraryPage({ params, searchParams }: P) {
  const { slug } = await params;
  const l = (await getLibraries()).find((x) => x.slug === slug);
  if (!l) notFound();
  return <Listing title={l.name} sp={await searchParams} library={slug} />;
}
