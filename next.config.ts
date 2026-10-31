import type { NextConfig } from "next";

function hostOf(url?: string) {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not a valid URL — check your environment variables.");
    return undefined;
  }
}
const supabaseHost = hostOf(process.env.NEXT_PUBLIC_SUPABASE_URL);

const config: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost }] : []),
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default config;
