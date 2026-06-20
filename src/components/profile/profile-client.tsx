"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function Status({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={
        msg.type === "ok"
          ? "rounded-md bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]"
          : "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {msg.text}
    </p>
  );
}

export default function ProfileClient({
  initialName,
  email,
  initialEmailOptIn,
}: {
  initialName: string;
  email: string;
  initialEmailOptIn: boolean;
}) {
  const router = useRouter();

  // ---- account form ----
  const [name, setName] = useState(initialName);
  const [emailOptIn, setEmailOptIn] = useState(initialEmailOptIn);
  const [savingAcct, setSavingAcct] = useState(false);
  const [acctMsg, setAcctMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ---- password form ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingAcct(true);
    setAcctMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOptIn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setAcctMsg({ type: "ok", text: "Profile updated." });
      router.refresh();
    } catch (err) {
      setAcctMsg({ type: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setSavingAcct(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setPwdMsg({ type: "ok", text: "Password changed." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwdMsg({ type: "err", text: err instanceof Error ? err.message : "Error." });
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Account details */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">Account details</h2>
          <form onSubmit={saveAccount} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="opacity-70" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className="text-sm">
                <span className="font-medium">Daily reminder email</span>
                <span className="block text-muted-foreground">
                  Get the 10 AM brief of open IPOs and your best picks.
                </span>
              </span>
            </label>
            <Status msg={acctMsg} />
            <Button type="submit" disabled={savingAcct}>
              {savingAcct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">Change password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur">Current password</Label>
              <Input
                id="cur"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Status msg={pwdMsg} />
            <Button type="submit" variant="outline" disabled={savingPwd}>
              {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
