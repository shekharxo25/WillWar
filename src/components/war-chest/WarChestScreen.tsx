"use client";

import { ArrowLeft, ArrowSquareOut, CheckCircle, Heart, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gate } from "@/components/app/Gate";
import { Button } from "@/components/ui/Button";
import { Chip, Switch } from "@/components/ui/Controls";
import { Cell, InsetGroup } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { publicEnv } from "@/env";
import { countryFromTimezone } from "@/lib/config/crisis-resources";
import { CAUSES, CHEST_LIMITS, type Currency, type ForfeitRule } from "@/lib/domain/constants";
import { forfeitRuleLabel, formatMoney, remainingMinor, validChestAmount } from "@/lib/domain/rules";
import type { Snapshot, WarChestEvent } from "@/lib/domain/types";
import { useWillWar } from "@/lib/store/provider";
import { causeFor, returnDate } from "@/lib/store/snapshot";
import { useAction } from "@/lib/store/use-action";
import { formatLongDay, formatShortDay, localDate } from "@/lib/time";

const MODE = publicEnv.NEXT_PUBLIC_WAR_CHEST_MODE;

export function WarChestScreen() {
  return <Gate>{(s) => <WarChest snapshot={s} />}</Gate>;
}

function Shell({ title, back = "/app/me", onBack, children }: { title: string; back?: string; onBack?: () => void; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[480px] px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className="pressable -ml-2 flex size-11 items-center justify-center rounded-full">
          <ArrowLeft size={22} aria-hidden />
        </button>
      ) : (
        <Link href={back} aria-label="Back" className="pressable -ml-2 flex size-11 items-center justify-center rounded-full">
          <ArrowLeft size={22} aria-hidden />
        </Link>
      )}
      <h1 className="mt-1 text-large-title font-bold">{title}</h1>
      <div className="mt-4">{children}</div>
    </main>
  );
}

function WarChest({ snapshot }: { snapshot: Snapshot }) {
  const chest = snapshot.warChest;
  if (MODE === "off") {
    return (
      <Shell title="War Chest">
        <p className="text-body text-label-2">The War Chest isn&apos;t available here yet.</p>
      </Shell>
    );
  }
  if (!snapshot.goal) {
    return (
      <Shell title="War Chest">
        <p className="text-body text-label-2">Start a challenge first. A War Chest backs one challenge at a time.</p>
      </Shell>
    );
  }
  if (chest && chest.status !== "cancelled" && chest.status !== "pending") return <ChestDetail snapshot={snapshot} />;
  return <Setup snapshot={snapshot} />;
}

/** W2–W6: amount → rule → cause → review → promise. */
function Setup({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const { store, refresh } = useWillWar();
  const { run, busy } = useAction();
  const country = countryFromTimezone(snapshot.profile.timezone);
  const currency: Currency = country === "IN" ? "INR" : "USD";
  const lim = CHEST_LIMITS[currency];
  const causes = CAUSES.filter((c) => c.country === "GLOBAL" || c.country === country);
  const [step, setStep] = useState<"amount" | "rule" | "cause" | "review">("amount");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [rule, setRule] = useState<ForfeitRule>("steady");
  const [causeId, setCauseId] = useState<string | null>(null);
  const end = formatLongDay(snapshot.goal!.endsOn);
  const back = returnDate(snapshot);
  const customMinor = custom ? Math.round(Number(custom) * 100) : null;
  const chosen = amount ?? (customMinor && validChestAmount(customMinor, currency) ? customMinor : null);

  // Stake mode (only after the legal sign-off): the server creates the chest and a Razorpay
  // order; the chest activates only when the verified webhook confirms the payment.
  const [stakeNote, setStakeNote] = useState<string | null>(null);
  const payStake = async () => {
    if (!chosen || !causeId) return;
    setStakeNote(null);
    try {
      const res = await fetch("/api/war-chest/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountMinor: chosen, currency, rule, causeId }),
      });
      const data = (await res.json()) as { error?: { message: string } } & Record<string, unknown>;
      if (!res.ok) return setStakeNote(data.error?.message ?? "Payments aren't available right now. Nothing was charged.");
      const { openCheckout } = await import("@/lib/payments/checkout-client");
      const result = await openCheckout(data as unknown as Parameters<typeof openCheckout>[0]);
      if (result === "submitted") {
        setStakeNote("Payment received. Your War Chest switches on as soon as it's confirmed.");
        setTimeout(() => void refresh(), 4000);
      }
    } catch {
      setStakeNote("Payments aren't available right now. Nothing was charged.");
    }
  };

  const confirm = async () => {
    if (!chosen || !causeId) return;
    if (MODE === "stake") return payStake();
    const ok = await run(() => store.createPromiseChest({ amountMinor: chosen, currency, forfeitRule: rule, causeId }).then(() => true), {
      success: `Promise made: ${formatMoney(chosen, currency)}.`,
    });
    if (ok) router.replace("/app/war-chest");
  };

  if (step === "amount") {
    return (
      <Shell title="Back your pledge?" back="/app/today">
        <p className="text-body text-label-2">
          Put an amount behind it. Each reset sends a quarter to a cause you pick. Make it to {end} and whatever&apos;s left
          comes back to you.
        </p>
        <p className="mt-2 text-headline text-tide">WillWar never keeps any of it.</p>
        <h2 className="mt-6 text-title-2 font-bold">How much?</h2>
        <p className="mt-1 text-subhead text-label-2">Pick an amount you&apos;d notice, not one that would hurt.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lim.presets.map((p) => (
            <Chip
              key={p}
              selected={amount === p}
              onClick={() => {
                setAmount(p);
                setCustom("");
              }}
            >
              <span className="num">{formatMoney(p, currency)}</span>
            </Chip>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-footnote text-label-2">
            Or your own amount ({formatMoney(lim.min, currency)}–{formatMoney(lim.max, currency)})
          </span>
          <div className="mt-1 flex h-[52px] items-center rounded-cell bg-surface px-3 ring-[0.5px] ring-separator focus-within:ring-2 focus-within:ring-tide">
            <span className="text-body text-label-2">{lim.symbol}</span>
            <input
              inputMode="numeric"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value.replace(/[^\d]/g, ""));
                setAmount(null);
              }}
              className="num h-full flex-1 bg-transparent px-1 text-body outline-none"
              aria-invalid={Boolean(customMinor && !validChestAmount(customMinor, currency))}
            />
          </div>
        </label>
        <Button full className="mt-8" disabled={!chosen} onClick={() => setStep("rule")}>
          Continue
        </Button>
        <Link href="/app/today" className="pressable mt-2 flex min-h-11 items-center justify-center text-headline text-tide">
          Not now
        </Link>
        <p className="mt-3 text-center text-footnote text-label-2">We&apos;ll only ask once. You&apos;ll find it in Me if you change your mind.</p>
      </Shell>
    );
  }

  if (step === "rule") {
    return (
      <Shell title="Choose the rule" onBack={() => setStep("amount")}>
        <div className="grid gap-2" role="radiogroup" aria-label="Rule">
          {(["steady", "strict"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rule === r}
              onClick={() => setRule(r)}
              className={`pressable rounded-card bg-surface p-4 text-left ${rule === r ? "ring-2 ring-tide" : "ring-[0.5px] ring-separator"}`}
            >
              <span className="flex items-center gap-2 text-headline">
                {forfeitRuleLabel(r)}
                {r === "steady" && <span className="rounded-full bg-tide-wash px-2 py-0.5 text-footnote text-tide">Recommended</span>}
              </span>
              <span className="mt-1 block text-subhead text-label-2">
                {r === "steady" ? "Each reset sends 25% to your cause. One slip doesn't end it." : "Your first reset sends all of it."}
              </span>
            </button>
          ))}
        </div>
        <Button full className="mt-8" onClick={() => setStep("cause")}>
          Continue
        </Button>
      </Shell>
    );
  }

  if (step === "cause") {
    return (
      <Shell title="Pick a cause" onBack={() => setStep("rule")}>
        <InsetGroup footer="We donate forfeits each month and publish the receipts. Causes are vetted by WillWar.">
          {causes.map((c) => (
            <Cell
              key={c.id}
              title={c.name}
              subtitle={c.description}
              onClick={() => setCauseId(c.id)}
              chevron={false}
              trailing={causeId === c.id ? <CheckCircle size={22} weight="fill" className="text-tide" aria-label="Selected" /> : null}
            />
          ))}
        </InsetGroup>
        <Button full className="mt-8" disabled={!causeId} onClick={() => setStep("review")}>
          Continue
        </Button>
      </Shell>
    );
  }

  const cause = causeFor(causeId);
  return (
    <Shell title="Review" onBack={() => setStep("cause")}>
      <InsetGroup>
        <Cell title="Amount" value={<span className="num">{chosen ? formatMoney(chosen, currency) : ""}</span>} chevron={false} />
        <Cell title="Rule" value={rule === "steady" ? "Steady, 25% per reset" : "Strict"} chevron={false} />
        <Cell title="Cause" value={cause?.name} chevron={false} />
        {back && <Cell title="Comes back on" value={formatShortDay(back)} chevron={false} />}
      </InsetGroup>
      <ul className="mt-5 grid gap-2 text-body">
        <li>Honor system. Nobody can check this but you.</li>
        {MODE === "promise" ? (
          <li>No money moves. On a reset you&apos;ll see your share and a link to donate it yourself.</li>
        ) : (
          <>
            <li>Changed your mind? Cancel within 24 hours for a full refund.</li>
            <li>Money tight later? Contact support and we&apos;ll return what&apos;s left.</li>
          </>
        )}
      </ul>
      {stakeNote && (
        <p className="mt-6 rounded-card bg-tertiary p-4 text-subhead" role="status">
          {stakeNote}
        </p>
      )}
      <Button full className="mt-8" busy={busy} onClick={confirm}>
        {MODE === "stake" && chosen ? `Pay ${formatMoney(chosen, currency)} into my War Chest` : "Make my promise"}
      </Button>
    </Shell>
  );
}

function eventLine(e: WarChestEvent, currency: Currency, causeName: string, tz: string) {
  const day = formatShortDay(localDate(new Date(e.createdAt), tz));
  const amt = formatMoney(e.amountMinor, currency);
  switch (e.kind) {
    case "promise_made":
      return `Promised ${amt} on ${day}`;
    case "funded":
      return `Paid ${amt} on ${day}`;
    case "forfeit":
      return `${amt} went to ${causeName} on ${day}`;
    case "promise_forfeit":
      return `You promised ${amt} to ${causeName} on ${day}`;
    case "cancelled":
      return `Cancelled on ${day}`;
    case "refund_issued":
      return `${amt} returned on ${day}`;
    case "settled":
      return `Settled on ${day}`;
  }
}

/** W7: the chest card, timeline, Backed badge, cancel window. */
function ChestDetail({ snapshot }: { snapshot: Snapshot }) {
  const { store } = useWillWar();
  const { run, busy } = useAction();
  const [cancelOpen, setCancelOpen] = useState(false);
  const chest = snapshot.warChest!;
  const cause = causeFor(chest.causeId);
  const left = remainingMinor(chest);
  const given = chest.forfeitedMinor;
  const back = returnDate(snapshot);
  const canCancel =
    chest.status === "active" && (chest.mode === "promise" || (chest.coolingOffUntil !== null && new Date(chest.coolingOffUntil) > new Date()));

  return (
    <Shell title="War Chest">
      <section className="rounded-card bg-surface p-5" aria-label="Your War Chest">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="num text-[2.5rem] leading-none font-semibold">{formatMoney(left, chest.currency)}</p>
            <p className="mt-1 text-subhead text-label-2">{chest.mode === "promise" ? "still promised to yourself" : "still yours"}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-tide-wash px-2.5 py-1 text-footnote text-tide">
            <Lock size={14} aria-hidden /> {chest.mode === "promise" ? "Promise" : "Held"}
          </span>
        </div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-tertiary" aria-hidden>
          <span className="bg-tide" style={{ width: `${(left / chest.amountMinor) * 100}%` }} />
          <span className="bg-label-3" style={{ width: `${(given / chest.amountMinor) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-footnote text-label-2">
          <span>{formatMoney(left, chest.currency)} yours</span>
          {given > 0 && (
            <span className="flex items-center gap-1">
              <Heart size={12} weight="fill" aria-hidden /> {formatMoney(given, chest.currency)} to {cause?.name}
            </span>
          )}
        </div>
        {back && chest.status === "active" && <p className="mt-4 border-t-[0.5px] border-separator pt-3 text-subhead">Comes back on {formatShortDay(back)}</p>}
        {chest.status === "settled" && <p className="mt-4 border-t-[0.5px] border-separator pt-3 text-subhead">This War Chest is settled.</p>}
      </section>

      <div className="mt-6 space-y-6">
        <InsetGroup>
          {cause && (
            <Cell title={cause.name} subtitle="Your cause" href={cause.url} external trailing={<ArrowSquareOut size={18} className="text-label-3" aria-hidden />} chevron={false} />
          )}
          <Cell title="Rule" value={chest.forfeitRule === "steady" ? "Steady, 25% per reset" : "Strict"} chevron={false} />
          <Cell
            title="Show a Backed badge to my pacts"
            subtitle="Never the amount"
            chevron={false}
            trailing={
              <Switch
                label="Show a Backed badge"
                checked={snapshot.profile.showBackedBadge}
                onCheckedChange={(v) => run(() => store.updatePreferences({ showBackedBadge: v }))}
              />
            }
          />
        </InsetGroup>

        {snapshot.warChestEvents.length > 0 && (
          <InsetGroup header="Timeline">
            {snapshot.warChestEvents.map((e) => (
              <Cell key={e.id} title={eventLine(e, chest.currency, cause?.name ?? "your cause", snapshot.profile.timezone)} chevron={false} />
            ))}
          </InsetGroup>
        )}

        <InsetGroup>
          {canCancel && <Cell title="Cancel my War Chest" tone="destructive" onClick={() => setCancelOpen(true)} />}
          {chest.mode === "stake" && !canCancel && <Cell title="Need it back early? Contact support" href="/support#war-chest" external />}
        </InsetGroup>
        <p className="px-4 text-footnote text-label-2">Honor system. Only you see this. WillWar never keeps any of it.</p>
      </div>

      <Sheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel your War Chest?"
        description={chest.mode === "promise" ? "Your promise ends. Your streak and pledge stay as they are." : `${formatMoney(left, chest.currency)} is returned to you.`}
      >
        <div className="grid gap-2">
          <Button
            variant="destructive"
            full
            busy={busy}
            onClick={async () => {
              const r = await run(() => store.cancelWarChest(), { success: "War Chest cancelled." });
              if (r) setCancelOpen(false);
            }}
          >
            Cancel my War Chest
          </Button>
          <Button variant="plain" full onClick={() => setCancelOpen(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </Shell>
  );
}
