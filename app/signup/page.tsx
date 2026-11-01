import { AuthForm } from "@/components/public/AuthForm";
export const metadata = { title: "Sign up" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return <AuthForm mode="signup" next={sp.next ?? "/"} error={sp.error} />;
}
