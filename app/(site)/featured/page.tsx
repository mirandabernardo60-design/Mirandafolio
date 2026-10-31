import { Listing, type SP } from "@/components/public/Listing";
export const metadata = { title: "Featured" };
export default async function Featured({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="Featured" sp={await searchParams} featuredOnly />;
}
