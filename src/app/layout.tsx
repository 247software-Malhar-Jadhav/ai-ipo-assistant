import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI IPO Assistant",
  description: "Discover, rank and track IPOs with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
