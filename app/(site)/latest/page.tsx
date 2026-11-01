import { Listing, type SP } from "@/components/public/Listing";
export const metadata = { title: "Latest Additions" };
export default async function Latest({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="Latest Additions" sp={{ ...(await searchParams), sort: "latest" }} latestOnly />;
}
