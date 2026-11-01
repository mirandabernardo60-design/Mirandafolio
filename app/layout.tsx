import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Miranda — Website inspiration library", template: "%s · Miranda" },
  description: "Miranda is a curated library of the best websites on the internet.",
  openGraph: { siteName: "Miranda", type: "website" },
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Miranda", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
