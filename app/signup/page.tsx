import { AuthForm } from "@/components/public/AuthForm";
export const metadata = { title: "Sign up" };
export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm mode="signup" next={(await searchParams).next ?? "/"} />;
}
