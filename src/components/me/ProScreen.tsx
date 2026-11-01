"use client";

import { ChatsCircle, Drop, GameController, Graph, Lock, Prohibit, ShieldCheck, Sparkle, Trophy, UsersThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useHud } from "@/components/ui/Hud";
import { cloudEnabled, publicEnv } from "@/env";
import { CURRENT_SEASON } from "@/lib/domain/constants";
import { useWillWar } from "@/lib/store/provider";
import { formatLongDay } from "@/lib/time";

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <GameController size={20} aria-hidden />, title: "All three urge games", body: "Drift, Swell, and Knots, the untangling puzzle." },
  { icon: <ChatsCircle size={20} aria-hidden />, title: "Talk it through", body: "A private coach for hard evenings. Nothing is saved." },
  { icon: <UsersThree size={20} aria-hidden />, title: "Unlimited pacts", body: "Pacts of up to 50 people." },
  { icon: <Trophy size={20} aria-hidden />, title: "Challenges", body: "First to 14 days, longest streak, most days kept." },
  { icon: <Sparkle size={20} aria-hidden />, title: "Trigger insights", body: "See the times and moods behind your resets." },
  { icon: <ShieldCheck size={20} aria-hidden />, title: "2 streak shields a month", body: "Cover a missed check-in without starting over." },
  { icon: <Lock size={20} aria-hidden />, title: "Encrypted journal backup", body: "Your notes, locked with a passphrase only you know." },
  { icon: <Drop size={20} aria-hidden />, title: "Tide themes", body: "Harbor, Dawn and Glacier water." },
  { icon: <Prohibit size={20} aria-hidden />, title: "No ads", body: "None, anywhere." },
];

type Plan = "season" | "annual";

export function ProScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const fromOnboarding = params.get("from") === "onboarding";
  const { isPro, store, status } = useWillWar();
  const hud = useHud();
  const [plan, setPlan] = useState<Plan>("season");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const close = fromOnboarding ? "/app/today" : "/app/me";

  useEffect(() => {
    if (status === "ready") void store.logEvent("paywall_shown");
  }, [status, store]);

  const getPro = async () => {
    if (!cloudEnabled) {
      setNote("Pro needs an online account, which this build doesn't have yet. Everything that keeps you safe stays free.");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { openCheckout } = await import("@/lib/payments/checkout-client");
      const result = await openCheckout(await res.json());
      if (result === "submitted") hud("Payment received. Pro switches on in a moment.");
    } catch {
      setNote("Payments aren't available right now. Try again later. Nothing was charged.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="flex h-11 items-center justify-between">
        <Link href={close} aria-label="Close" className="pressable glass -ml-1 flex size-11 items-center justify-center rounded-full">
          <X size={20} aria-hidden />
        </Link>
        {cloudEnabled && (
          <Link href="/app/sign-in" className="pressable min-h-11 content-center text-subhead text-tide">
            Restore
          </Link>
        )}
      </div>

      <div className="mt-2 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-tide-wash text-tide">
          <Graph size={28} aria-hidden />
        </span>
        <h1 className="mt-3 text-large-title font-bold">WillWar Pro</h1>
        <p className="mt-1 text-body text-label-2">More tools for your thirty days.</p>
      </div>

      {isPro ? (
        <p className="mt-6 rounded-card bg-tide-wash p-4 text-center text-headline text-tide">You&apos;re on Pro.</p>
      ) : null}

      <ul className="mt-6 overflow-hidden rounded-card bg-surface">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3 px-4 py-3 [&:not(:last-child)]:border-b-[0.5px] [&:not(:last-child)]:border-separator">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-tide-wash text-tide">{f.icon}</span>
            <span>
              <span className="block text-headline">{f.title}</span>
              <span className="block text-subhead text-label-2">{f.body}</span>
            </span>
          </li>
        ))}
      </ul>

      {!isPro && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Plan">
            <PlanCard
              selected={plan === "season"}
              onSelect={() => setPlan("season")}
              title="Season pass"
              price={`₹${publicEnv.NEXT_PUBLIC_PRICE_SEASON_INR}`}
              note={`Until ${formatLongDay(CURRENT_SEASON.endsOn)}`}
            />
            <PlanCard
              selected={plan === "annual"}
              onSelect={() => setPlan("annual")}
              title="Annual"
              price={`₹${publicEnv.NEXT_PUBLIC_PRICE_ANNUAL_INR}`}
              note="Renews yearly"
              tag="Best value"
            />
          </div>
          {note && (
            <p className="mt-4 rounded-card bg-tertiary p-3 text-subhead" role="status">
              {note}
            </p>
          )}
          <div className="mt-6 grid gap-2">
            <Button full busy={busy} onClick={getPro}>
              Get Pro
            </Button>
            <Button variant="secondary" full onClick={() => router.push(close === "/app/me" ? "/app/today" : close)}>
              Continue with Free
            </Button>
          </div>
          <p className="mt-4 text-center text-footnote text-label-2">
            Prices include taxes. The season pass doesn&apos;t renew. Annual renews each year until you cancel, which you can do
            anytime in Settings. Ride it out with Drift and Swell, resets, crisis support, export and deletion are always
            free.
          </p>
        </>
      )}
    </main>
  );
}

function PlanCard({
  selected,
  onSelect,
  title,
  price,
  note,
  tag,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  note: string;
  tag?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`pressable rounded-card bg-surface p-4 text-left ${selected ? "ring-2 ring-tide" : "ring-[0.5px] ring-separator"}`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="text-subhead">{title}</span>
        {tag && <span className="rounded-full bg-tide-wash px-2 py-0.5 text-[11px] font-semibold text-tide">{tag}</span>}
      </span>
      <span className="num mt-1 block text-[1.75rem] font-semibold">{price}</span>
      <span className="block text-footnote text-label-2">{note}</span>
    </button>
  );
}
