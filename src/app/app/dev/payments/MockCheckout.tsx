"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { formatMoney } from "@/lib/config/causes";

export function MockCheckout() {
  const q = useSearchParams();
  const router = useRouter();
  const { store, refresh, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const plan = q.get("plan") === "annual" ? "annual" : "season";
  const chest = q.get("chest");
  const amount = Number(q.get("amount") ?? 0);
  const currency = q.get("currency") === "USD" ? "USD" : "INR";

  async function simulate(action: "pay" | "refund") {
    setBusy(true);
    setNote(null);
    try {
      if (store.mode === "device") {
        if (chest) {
          setNote("Device mode has no stake payments. Promise mode needs no checkout.");
          return;
        }
        await store.devSetEntitlement?.(plan);
      } else {
        const res = await fetch("/app/dev/payments/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chest ? { action, chest, amount, currency } : { plan }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string; action?: string };
        if (!res.ok || data.ok === false) {
          setNote(`Handler said: ${data.error ?? "failed"}`);
          return;
        }
      }
      await refresh();
      if (!chest) {
        toast("You're on Pro.");
        router.replace("/app/today");
      } else {
        setNote(action === "pay" ? "Payment captured. The War Chest is active." : "Refund recorded.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="MOCK CHECKOUT" back="/app/pro" bottomPad={false}>
      <div className="rounded-card bg-raised p-5">
        <p className="text-[13px] leading-[18px] text-text-2">Development only</p>
        <p className="mt-2 text-[17px] leading-[22px]">
          {chest ? `War Chest ${formatMoney(amount, currency)}` : plan === "annual" ? "Annual" : "Season pass"}
        </p>
        <p className="mt-1 text-[15px] leading-5 text-text-2">These buttons call the same handlers the verified webhook calls.</p>
      </div>
      <div className="mt-6 space-y-3">
        <Button disabled={busy} onClick={() => simulate("pay")}>Simulate payment success</Button>
        {chest && (
          <Button variant="secondary" disabled={busy} onClick={() => simulate("refund")}>
            Simulate refund processed
          </Button>
        )}
      </div>
      {note && <p className="mt-4 text-[15px] leading-5 text-text-2" role="status">{note}</p>}
    </Screen>
  );
}
