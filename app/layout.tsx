// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Primeasia University Games and Sports Club",
  description:
    "Apply for the Executive Committee of Primeasia University Games and Sports Club. Sign in with your Google account to submit your application.",
  keywords: ["Primeasia", "Games and Sports Club", "University", "Executive Committee"],
  openGraph: {
    title: "Primeasia University Games and Sports Club",
    description: "Join the Executive Committee — Apply Now",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-mesh antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
