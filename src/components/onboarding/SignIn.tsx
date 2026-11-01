"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cloudEnabled } from "@/env";
import { consumePendingJoin } from "@/lib/social/pending";
import { useWillWar } from "@/lib/store/provider";
import { getBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Returning people sign in with a 6-digit email code. Codes, not magic links: a magic
 * link opens Safari instead of the installed app on iOS (pwa-native-feel.md).
 */
export function SignIn() {
  const router = useRouter();
  const { status, refresh } = useWillWar();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ready") router.replace("/app/today");
    if (status === "needs-onboarding") router.replace("/app/start");
  }, [status, router]);

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-dvh flex-col px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <Link href="/" aria-label="Back to WillWar" className="pressable -ml-2 flex size-11 items-center justify-center rounded-full">
        <ArrowLeft size={22} aria-hidden />
      </Link>
      {children}
    </main>
  );

  if (!cloudEnabled) {
    return shell(
      <section className="mt-4 flex flex-1 flex-col">
        <h1 className="text-large-title font-bold">Your account is on this device.</h1>
        <p className="mt-2 text-body text-label-2">
          This build keeps everything on the phone you started on, so there&apos;s nothing to sign in to. Open WillWar on that
          device, or start fresh here.
        </p>
        <div className="mt-auto grid gap-2 pt-8">
          <ButtonLink href="/app/today" full>
            Open my streak
          </ButtonLink>
          <ButtonLink href="/app/start" variant="plain" full>
            Start my 30 days
          </ButtonLink>
        </div>
      </section>,
    );
  }

  const send = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await getBrowserSupabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (e) setError("We couldn't find an account for that email. Check it, or start your 30 days.");
    else setPhase("code");
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { error: e } = await getBrowserSupabase().auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
    if (e) {
      setBusy(false);
      return setError("That code didn't work. Check the latest email and try again.");
    }
    const joined = await consumePendingJoin().catch(() => null);
    await refresh();
    setBusy(false);
    router.replace(joined ? `/app/pact/${joined}` : "/app/today");
  };

  return shell(
    <section className="mt-4 flex flex-1 flex-col">
      <h1 className="text-large-title font-bold">{phase === "email" ? "Welcome back." : "Enter your code."}</h1>
      <p className="mt-2 text-body text-label-2">
        {phase === "email" ? "We'll email you a 6-digit code." : `We sent a 6-digit code to ${email}.`}
      </p>
      <div className="mt-6">
        {phase === "email" ? (
          <label className="block">
            <span className="text-footnote text-label-2">Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-body ring-[0.5px] ring-separator focus:ring-2 focus:ring-tide focus:outline-none"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-footnote text-label-2">6-digit code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="num mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-center text-[1.5rem] tracking-[0.3em] ring-[0.5px] ring-separator focus:ring-2 focus:ring-tide focus:outline-none"
            />
          </label>
        )}
        {error && (
          <p className="mt-2 text-footnote text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="mt-auto grid gap-2 pt-8">
        {phase === "email" ? (
          <Button full busy={busy} disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={send}>
            Send my code
          </Button>
        ) : (
          <Button full busy={busy} disabled={!/^\d{6}$/.test(code)} onClick={verify}>
            Sign in
          </Button>
        )}
        <ButtonLink href="/app/start" variant="plain" full>
          New here? Start my 30 days
        </ButtonLink>
      </div>
    </section>,
  );
}
