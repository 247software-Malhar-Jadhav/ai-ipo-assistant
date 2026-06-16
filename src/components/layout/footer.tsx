import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} AI IPO Assistant</p>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-xs">
            For research only · not investment advice
          </span>
        </div>
      </div>
    </footer>
  );
}
