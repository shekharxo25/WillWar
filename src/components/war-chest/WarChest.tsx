"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Cell, CellGroup, Toggle } from "@/components/ui/Cell";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { WarChestCard } from "./WarChestCard";
import { BeltPlate } from "@/components/clock/Tally";
import { CAUSES, CHEST_AMOUNTS, formatMoney } from "@/lib/config/causes";
import { warChestMode } from "@/lib/config/flags";
import { addDays, localDate, shortDate } from "@/lib/time";
import { validChestAmount } from "@/lib/store/engine";
import { StoreError } from "@/lib/store/types";

/**
 * War Chest (Part 3.9). No ads, no Pro upsell, no countdowns on any screen here.
 * Promise mode by default; stake mode only behind NEXT_PUBLIC_WAR_CHEST_MODE=stake.
 */
export function WarChest() {
  const { snap, loading } = useApp();
  const mode = warChestMode();
  if (mode === "off") return <Screen title="WAR CHEST" back="/app/me"><p className="text-text-2">The War Chest isn&apos;t available.</p></Screen>;
  if (loading || !snap) return <Screen title="WAR CHEST" back="/app/me"><div className="skeleton h-40 w-full" /></Screen>;
  const chest = snap.warChest && snap.warChest.goalId === snap.goal?.id ? snap.warChest : snap.warChest?.status === "settled" ? snap.warChest : null;
  if (chest && chest.status !== "cancelled") return <Detail />;
  return <Setup />;
}

function Setup() {
  const { snap, store, refresh, toast } = useApp();
  const router = useRouter();
  const mode = warChestMode();
  const currency: "INR" | "USD" = snap?.profile.country === "US" ? "USD" : "INR";
  const cfg = CHEST_AMOUNTS[currency];
  const [step, setStep] = useState<"amount" | "rule" | "cause" | "review">("amount");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [rule, setRule] = useState<"steady" | "strict" | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!snap?.goal || snap.goal.closedAt) return <Screen title="WAR CHEST" back="/app/me"><p className="text-text-2">Start a challenge first. You can back it from here.</p></Screen>;
  const endsOn = snap.goal.endsOn;
  const backDate = shortDate(addDays(endsOn, 1));
  const customMinor = custom ? Math.round(Number(custom) * 100) : null;
  const chosen = amount ?? (customMinor && validChestAmount(customMinor, currency) ? customMinor : null);
  const causes = CAUSES.filter((c) => c.country === snap.profile.country || c.country === "GLOBAL" || (!snap.profile.country && c.country === "IN"));
  const daysLeft = (() => {
    const t = localDate(new Date(), snap.profile.timezone);
    const [a, b] = [t, endsOn].map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)));
    return Math.round((b - a) / 86400_000);
  })();

  const submit = async () => {
    if (!chosen || !rule || !cause) return;
    setBusy(true);
    setErr(null);
    try {
      if (mode === "stake") {
        const res = await fetch("/api/war-chest/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ amountMinor: chosen, currency, rule, cause }) });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok) throw new StoreError(data.error ?? "checkout_failed");
        if (data.url) location.href = data.url;
        return;
      }
      await store.createPromiseChest(chosen, currency, rule, cause);
      await refresh();
      toast(`Promise made: ${formatMoney(chosen, currency)}.`);
      router.replace("/app/war-chest");
    } catch (e) {
      const c = e instanceof StoreError ? e.code : "";
      setErr(
        c === "stake_goal_too_short" || daysLeft < 7
          ? "A War Chest needs a week or more left in your challenge."
          : c === "chest_exists"
            ? "This challenge already has a War Chest."
            : "That didn't go through. Nothing was charged. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="WAR CHEST" back={step === "amount" ? "/app/me" : undefined}>
      {step !== "amount" && (
        <button type="button" className="press -mt-2 mb-2 min-h-[44px] text-[17px]" onClick={() => setStep(step === "review" ? "cause" : step === "cause" ? "rule" : "amount")}>
          Back
        </button>
      )}
      {step === "amount" && (
        <>
          <p className="text-[17px] leading-[22px] text-text-2">
            {mode === "promise" ? "Name an amount and a cause. If you reset, you donate your share yourself." : "Pick an amount you'd notice, not one that would hurt."}
          </p>
          {mode === "promise" && <p className="mt-2 text-[15px] leading-5 text-text-2">Pick an amount you&apos;d notice, not one that would hurt.</p>}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {cfg.presets.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={amount === p}
                onClick={() => { setAmount(p); setCustom(""); }}
                className={`press display h-16 rounded-button text-[32px] ${amount === p ? "bg-primary text-on-primary" : "bg-raised"}`}
              >
                {formatMoney(p, currency)}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Input
              inputMode="decimal"
              placeholder={`Custom (${formatMoney(cfg.min, currency)}–${formatMoney(cfg.max, currency)})`}
              value={custom}
              onChange={(e) => { setCustom(e.target.value.replace(/[^\d.]/g, "")); setAmount(null); }}
              error={custom && !chosen ? `Enter between ${formatMoney(cfg.min, currency)} and ${formatMoney(cfg.max, currency)}.` : null}
            />
          </div>
          <Button className="mt-8" disabled={!chosen} onClick={() => setStep("rule")}>Continue</Button>
        </>
      )}
      {step === "rule" && (
        <div className="space-y-3">
          {([
            ["steady", "Steady (Recommended)", "Each reset sends 25% to your cause. One slip doesn't end it."],
            ["strict", "Strict", "Your first reset sends all of it."],
          ] as const).map(([k, t, s]) => (
            <button key={k} type="button" aria-pressed={rule === k} onClick={() => setRule(k)} className={`press block w-full rounded-card bg-raised p-4 text-left ${rule === k ? "shadow-[inset_0_0_0_2px_var(--text)]" : ""}`}>
              <span className="block font-semibold">{t}</span>
              <span className="mt-1 block text-[15px] leading-5 text-text-2">{s}</span>
            </button>
          ))}
          <Button className="mt-5" disabled={!rule} onClick={() => setStep("cause")}>Continue</Button>
        </div>
      )}
      {step === "cause" && (
        <div className="space-y-3">
          {causes.map((c) => (
            <button key={c.id} type="button" aria-pressed={cause === c.id} onClick={() => setCause(c.id)} className={`press block w-full rounded-card bg-raised p-4 text-left ${cause === c.id ? "shadow-[inset_0_0_0_2px_var(--text)]" : ""}`}>
              <span className="block font-semibold">{c.name}</span>
              <span className="mt-1 block text-[15px] leading-5 text-text-2">{c.placeholder ? "Placeholder until real causes are vetted." : c.url}</span>
            </button>
          ))}
          <p className="text-[13px] leading-[18px] text-text-2">We donate forfeits each month and publish the receipts.</p>
          <Button className="mt-5" disabled={!cause} onClick={() => setStep("review")}>Continue</Button>
        </div>
      )}
      {step === "review" && chosen && rule && cause && (
        <>
          <CellGroup>
            <Cell title="Amount" value={formatMoney(chosen, currency)} />
            <Cell title="Rule" value={rule === "steady" ? "Steady" : "Strict"} />
            <Cell title="Cause" value={CAUSES.find((c) => c.id === cause)?.name} />
            <Cell title="Comes back on" value={backDate} />
          </CellGroup>
          <div className="mt-5 space-y-2 text-[15px] leading-5 text-text-2">
            <p>Honor system. Nobody can check this but you.</p>
            {mode === "stake" && <p>Changed your mind? Cancel within 24 hours for a full refund.</p>}
            {mode === "stake" && <p>Money tight later? Contact support and we&apos;ll return what&apos;s left.</p>}
            {mode === "promise" && <p>No money moves. Cancel any time.</p>}
          </div>
          {err && <p className="mt-3 text-[13px] leading-[18px] text-destructive">{err}</p>}
          <Button className="mt-8" disabled={busy} onClick={submit}>
            {mode === "stake" ? `Pay ${formatMoney(chosen, currency)} into my War Chest` : "Make my promise"}
          </Button>
        </>
      )}
    </Screen>
  );
}

function Detail() {
  const { snap, store, refresh, toast } = useApp();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const chest = snap!.warChest!;
  const cause = CAUSES.find((c) => c.id === chest.causeId);
  const causeName = cause?.name ?? "your cause";
  const yours = chest.amountMinor - chest.forfeitedMinor;
  const endsOn = snap!.goal?.id === chest.goalId ? snap!.goal!.endsOn : null;
  const backDate = endsOn ? shortDate(addDays(endsOn, 1)) : null;
  const canCancel = chest.status === "active" && (chest.mode === "promise" || (chest.coolingOffUntil && new Date() < new Date(chest.coolingOffUntil)));
  const lastForfeit = [...snap!.warChestEvents].reverse().find((e) => e.kind === "forfeit" || e.kind === "promise_forfeit");
  const settled = chest.status === "settled" || chest.status === "settling";

  const cancel = async () => {
    try {
      const r = await store.cancelWarChest();
      toast(r === "refund_pending" ? `War Chest cancelled. ${formatMoney(yours, chest.currency)} is on its way back.` : "War Chest cancelled.");
      await refresh();
      router.replace("/app/me");
    } catch {
      toast("Couldn't cancel. Contact support and we'll sort it.");
    }
    setConfirm(false);
  };

  const label = (k: string) =>
    ({ promise_made: "Promise made", funded: "Paid", forfeit: "Sent to your cause", promise_forfeit: "Promised to your cause", cancelled: "Cancelled", refund_issued: "Returned to you", settled: "Settled" })[k] ?? k;

  return (
    <Screen title="WAR CHEST" back="/app/me">
      {settled && (
        <div className="mb-6 rounded-card bg-raised p-5">
          <BeltPlate name="30 days" />
          <p className="mt-4 text-[17px] leading-[22px]">
            {chest.mode === "stake"
              ? `${formatMoney(yours, chest.currency)} is on its way back to you. It usually reaches your account in 5–7 working days.`
              : `You kept your promise. ${formatMoney(yours, chest.currency)} stays yours.`}
          </p>
          {chest.forfeitedMinor > 0 && <p className="mt-2 text-[15px] leading-5 text-text-2">{formatMoney(chest.forfeitedMinor, chest.currency)} went to {causeName}. Thank you.</p>}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => router.push("/app/today")}>Not now</Button>
            <Button onClick={() => router.push("/app/settings#challenge")}>Start another 30 days</Button>
          </div>
        </div>
      )}
      <WarChestCard amountMinor={chest.amountMinor} forfeitedMinor={chest.forfeitedMinor} currency={chest.currency} causeName={causeName} endsOn={settled ? null : endsOn} />
      {!settled && chest.forfeitedMinor > 0 && lastForfeit && (
        <div className="mt-4 rounded-card bg-raised p-4 text-[15px] leading-5">
          {chest.mode === "promise" ? (
            <>
              <p>You promised {formatMoney(lastForfeit.amountMinor, chest.currency)} to {causeName} for this reset.</p>
              {cause && <a href={cause.url} target="_blank" rel="noreferrer" className="press mt-2 inline-flex min-h-[44px] items-center font-semibold underline underline-offset-4">Donate now</a>}
            </>
          ) : (
            <p>{formatMoney(yours, chest.currency)} is still yours. Keep going and it comes back on {backDate}.</p>
          )}
        </div>
      )}
      <CellGroup header="Timeline">
        {snap!.warChestEvents.map((e) => (
          <Cell key={e.id} title={`${label(e.kind)}${e.amountMinor ? ` ${formatMoney(e.amountMinor, chest.currency)}` : ""}`} subtitle={`on ${shortDate(e.createdAt.slice(0, 10))}`} />
        ))}
      </CellGroup>
      <CellGroup>
        {cause && <Cell title={causeName} subtitle={cause.placeholder ? "Placeholder cause" : cause.url} href={cause.url} />}
        <Cell
          title="Show a Backed badge"
          subtitle="Your camp sees that you have a War Chest, never the amount."
          accessory={<Toggle checked={snap!.profile.showBackedBadge} onChange={async (v) => { await store.updatePreferences({ showBackedBadge: v }); await refresh(); }} label="Show a Backed badge" />}
          chevron={false}
        />
      </CellGroup>
      {!settled && (
        <CellGroup footer={chest.mode === "stake" ? "Need it back early? Contact support." : undefined}>
          {canCancel && <Cell title="Cancel my War Chest" onClick={() => setConfirm(true)} chevron={false} />}
          {chest.mode === "stake" && <Cell title="Contact support" href="/support" />}
        </CellGroup>
      )}
      <Sheet open={confirm} onOpenChange={setConfirm} title="CANCEL YOUR WAR CHEST?" description={chest.mode === "stake" ? `${formatMoney(yours, chest.currency)} comes back to you.` : "Your promise ends. Nothing else changes."}>
        <Button variant="destructive" onClick={cancel}>Cancel my War Chest</Button>
        <Button variant="plain" className="mt-2 w-full" onClick={() => setConfirm(false)}>Keep it</Button>
      </Sheet>
    </Screen>
  );
}
