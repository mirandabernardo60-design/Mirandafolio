import { notFound } from "next/navigation";
import { Listing, type SP } from "@/components/public/Listing";
import { getTags } from "@/lib/queries";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  const t = (await getTags()).find((x) => x.slug === slug);
  return { title: t ? `#${t.name}` : "Tag" };
}

export default async function TagPage({ params, searchParams }: P) {
  const { slug } = await params;
  const t = (await getTags()).find((x) => x.slug === slug);
  if (!t) notFound();
  return <Listing title={`#${t.name}`} sp={await searchParams} tag={slug} />;
}
