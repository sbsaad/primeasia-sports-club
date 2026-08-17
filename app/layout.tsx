// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL("https://pausc.vercel.app"),
  title: "Primeasia University Games and Sports Club (PaUGSC) — Member Registration 2026",
  description:
    "Official Member Registration & Digital Pass Portal for Primeasia University Games and Sports Club (PaUGSC). Register online and download your official 2026 sports pass.",
  keywords: [
    "Primeasia University",
    "Games and Sports Club",
    "PaUGSC",
    "Sports Club Registration",
    "Primeasia University Sports",
    "Member Registration 2026",
  ],
  authors: [{ name: "Primeasia University Games and Sports Club" }],
  openGraph: {
    title: "Primeasia University Games & Sports Club — Member Registration 2026",
    description:
      "Join PaUGSC! Register as an official general member, verify your bKash payment, and get your certified 3D Holographic Member Pass.",
    url: "https://pausc.vercel.app",
    siteName: "Primeasia University Games and Sports Club",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Primeasia University Games & Sports Club — Member Registration 2026",
    description:
      "Official Member Registration for Primeasia University Games and Sports Club. Join now and get your digital sports pass.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-mesh antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
