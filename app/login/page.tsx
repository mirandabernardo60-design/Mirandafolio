import { AuthForm } from "@/components/public/AuthForm";
export const metadata = { title: "Sign in" };
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm mode="signin" next={(await searchParams).next ?? "/"} />;
}
