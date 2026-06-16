import type { Metadata } from "next";
import "./globals.css";
import Navbar, { type NavUser } from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "AI IPO Assistant — Discover, rank & track IPOs with AI",
  description:
    "Find live and upcoming IPOs, get AI-powered conviction scores based on GMP, subscription and fundamentals, track what you've applied to, and get a daily email reminder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth state is wired in once the session layer exists; null = logged out.
  const user: NavUser = null;

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
