import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI IPO Assistant — Discover, rank & track IPOs with AI",
  description:
    "Find live and upcoming IPOs, get AI-powered conviction scores based on GMP, subscription and fundamentals, track what you've applied to, and get a daily email reminder.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Navbar user={user} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
