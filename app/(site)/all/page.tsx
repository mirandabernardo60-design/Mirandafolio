import { Listing, type SP } from "@/components/public/Listing";
export const metadata = { title: "All websites" };
export default async function All({ searchParams }: { searchParams: Promise<SP> }) {
  return <Listing title="All websites" sp={{ ...(await searchParams) }} />;
}
