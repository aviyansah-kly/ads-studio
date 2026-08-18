import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KLY Ads Gallery Homepage",
  description: "Explore KLY advertising products by campaign objective, preview experiences, compare options, and build a better campaign brief.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
