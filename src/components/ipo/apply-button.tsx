"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplyButton({
  ipoId,
  initialApplied,
  authed,
  canApply,
}: {
  ipoId: string;
  initialApplied: boolean;
  authed: boolean;
  canApply: boolean;
}) {
  const [applied, setApplied] = useState(initialApplied);
  const [busy, setBusy] = useState(false);

  if (!canApply) {
    return (
      <Button variant="outline" disabled>
        Application window closed
      </Button>
    );
  }

  if (!authed) {
    return (
      <Link href="/login">
        <Button variant="outline">Log in to track this</Button>
      </Link>
    );
  }

  async function toggle() {
    const next = !applied;
    setBusy(true);
    setApplied(next); // optimistic
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipoId, applied: next }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApplied(!!data.applied);
    } catch {
      setApplied(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={applied ? "secondary" : "default"} onClick={toggle} disabled={busy}>
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : applied ? (
        <Check className="h-4 w-4" />
      ) : null}
      {applied ? "Applied" : "Mark as applied"}
    </Button>
  );
}
