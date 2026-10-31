import { notFound } from "next/navigation";
import { Listing, type SP } from "@/components/public/Listing";
import { getCategories } from "@/lib/queries";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return { title: c?.name ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: P) {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  if (!c) notFound();
  return <Listing title={c.name} sp={await searchParams} category={slug} showHome />;
}
