import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ListChecks,
  BellRing,
  ShieldCheck,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: TrendingUp,
    title: "Every IPO, one place",
    desc: "Live, upcoming and closed IPOs with price band, lot size, GMP and subscription — always current.",
  },
  {
    icon: Sparkles,
    title: "AI conviction score",
    desc: "Each IPO gets a 0–10 score and a label (avoid → high conviction) with a short reason, powered by Groq + LangChain.",
  },
  {
    icon: Gauge,
    title: "Ranked by what matters",
    desc: "Sorted by grey-market premium, subscription demand, issue size and sector — best picks float to the top.",
  },
  {
    icon: ListChecks,
    title: "Track your applications",
    desc: "Mark IPOs as applied and never lose track of where you stand across the open window.",
  },
  {
    icon: BellRing,
    title: "Daily 10 AM reminder",
    desc: "A morning email lists open IPOs, the best ones to apply to, and the ones you still haven't applied to.",
  },
  {
    icon: ShieldCheck,
    title: "Free & private",
    desc: "Built entirely on free tools — Groq, Postgres and Gmail. Your data stays in your own database.",
  },
];

const steps = [
  {
    n: "01",
    title: "Browse IPOs",
    desc: "Open the dashboard and filter by live, upcoming or closed.",
  },
  {
    n: "02",
    title: "Let AI rank them",
    desc: "Scores and labels surface the strong ones and flag the ones to avoid.",
  },
  {
    n: "03",
    title: "Apply & track",
    desc: "Mark what you've applied to and get a daily reminder for the rest.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" />
            AI-powered IPO research
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Stop guessing which{" "}
            <span className="text-[var(--brand)]">IPO</span> to apply to.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            AI IPO Assistant pulls together every live and upcoming IPO, ranks
            them with an AI conviction score, tracks what you&apos;ve applied
            to, and emails you a reminder every morning at 10 AM.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started — it&apos;s free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Explore the dashboard
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card · Free LLM · Open source stack
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need before the window closes
          </h2>
          <p className="mt-3 text-muted-foreground">
            Research, rank, apply and remember — without the spreadsheets.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-4xl font-bold text-[var(--brand)]/30">
                  {s.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Card className="overflow-hidden border-[var(--brand)]/20 bg-gradient-to-br from-[var(--brand)]/10 to-transparent">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="max-w-xl text-3xl font-bold tracking-tight">
              Ready to invest smarter in the next IPO?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Create a free account and let the assistant do the watching for
              you.
            </p>
            <Link href="/signup">
              <Button size="lg" className="mt-2 gap-2">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
