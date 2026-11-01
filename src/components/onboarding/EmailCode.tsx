"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** 6-digit email codes (magic links open in Safari instead of the installed app). */
export function EmailCode({ onSignedIn }: { onSignedIn: () => void | Promise<void> }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sb = supabaseBrowser();
  if (!sb) return null;

  const send = async () => {
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter an email like name@example.com.");
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setErr("We couldn't send a code. Check the address and try again.");
    setSent(true);
  };
  const verify = async () => {
    setErr(null);
    if (!/^\d{6}$/.test(code)) return setErr("Enter the 6 digits from the email.");
    setBusy(true);
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      setBusy(false);
      return setErr("That code didn't work. Check the latest email, or send a new code.");
    }
    await onSignedIn();
    setBusy(false);
  };

  if (!sent)
    return (
      <div className="space-y-3">
        <Input type="email" inputMode="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value.trim())} error={err} />
        <Button onClick={send} disabled={busy}>Continue with email</Button>
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-5 text-text-2">We sent a 6-digit code to {email}.</p>
      <input
        aria-label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="led h-16 w-full rounded-button bg-housing text-center text-[32px] tracking-[0.3em] text-[var(--led-housing)] outline-none"
        placeholder="000000"
      />
      {err && <p className="text-[13px] leading-[18px] text-destructive">{err}</p>}
      <Button onClick={verify} disabled={busy || code.length !== 6}>Confirm code</Button>
      <Button variant="plain" onClick={() => { setSent(false); setCode(""); }} className="w-full">Use a different email</Button>
    </div>
  );
}

export async function signInWithGoogle(next: string) {
  const sb = supabaseBrowser();
  if (!sb) return;
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/app/auth/callback?next=${encodeURIComponent(next)}` } });
}
