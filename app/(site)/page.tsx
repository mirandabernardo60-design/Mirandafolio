import { Listing, type SP } from "@/components/public/Listing";

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="Explore" sp={await searchParams} showHome />;
}
