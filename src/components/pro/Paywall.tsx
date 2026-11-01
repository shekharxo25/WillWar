"use client";
import { Check } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/Button";
import { PLANS, PRO_FEATURES, type PlanId } from "@/lib/config/plans";
import { startCheckout } from "./checkout";

const ERRORS: Record<string, string> = {
  not_authenticated: "Sign in to buy Pro, so it follows your account.",
  payments_unavailable: "Payments aren't switched on yet. Try again later.",
  plan_not_configured: "Annual isn't available yet. The season pass works.",
  razorpay_load_failed: "Checkout didn't load. Check your connection and try again.",
};

/**
 * Pro paywall (Part 3.2 step 10). Nothing pre-selected; "Get Pro" stays disabled until a plan
 * is picked; "Continue with Free" is equally clear. No timers, no ads, no War Chest.
 */
export function Paywall({ source, onContinueFree, onPro }: { source: "onboarding" | "feature"; onContinueFree: () => void; onPro?: () => void }) {
  const { refresh, toast } = useApp();
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getPro() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    const out = await startCheckout(
      plan,
      async () => {
        // The webhook grants Pro; give it a moment, then refresh.
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          await refresh();
        }
        toast("You're on Pro.");
        onPro?.();
      },
      () => setBusy(false),
    );
    if (out.kind === "mock") router.push(out.url);
    else if (out.kind === "error") {
      setError(ERRORS[out.code] ?? "Checkout didn't start. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      {source === "onboarding" && <h1 className="display text-[40px] leading-[40px]">WILLWAR PRO</h1>}
      <ul className="mt-4 space-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-[17px] leading-[22px]">
            <Check weight="bold" size={18} className="shrink-0 text-text-2" aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Plan">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const on = plan === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPlan(id)}
              className={`press flex min-h-[132px] flex-col rounded-card bg-raised p-4 text-left ${on ? "shadow-[inset_0_0_0_2px_var(--text)]" : "shadow-[inset_0_0_0_0.5px_var(--hairline)]"}`}
            >
              <span className="text-[13px] leading-[18px] text-text-2">{id === "annual" ? "Best value" : " "}</span>
              <span className="mt-1 text-[17px] leading-[22px] font-semibold">{p.name}</span>
              <span className="display mt-2 text-[34px] leading-[34px]">₹{p.inr}</span>
              <span className="mt-auto pt-2 text-[13px] leading-[18px] text-text-2">{id === "season" ? "Until 30 Nov" : "Per year"}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] leading-[18px] text-text-2">
        Prices include taxes. The season pass is a one-time payment. Annual renews each year until you cancel in Settings. Restore by signing in.
      </p>

      {error && <p className="mt-3 text-[13px] leading-[18px] text-destructive" role="alert">{error}</p>}

      <div className="mt-6 space-y-3">
        <Button disabled={!plan || busy} onClick={getPro}>Get Pro</Button>
        <Button variant="secondary" onClick={onContinueFree}>Continue with Free</Button>
      </div>
    </div>
  );
}
