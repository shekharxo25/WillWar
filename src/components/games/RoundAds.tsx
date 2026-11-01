"use client";
import { useEffect, useRef, useState } from "react";
import { AdSlot, type Placement } from "@/components/ads/AdSlot";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useMounted } from "./useMounted";

/** Renders an AdSlot and reports when it rendered nothing (house mode stub, Pro, no fill). */
function AdProbe({ placement, onEmpty, onReward, onClose }: { placement: Placement; onEmpty: () => void; onReward?: () => void; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (ref.current && ref.current.childElementCount === 0) onEmpty();
    }, 50);
    return () => clearTimeout(t);
  }, [onEmpty]);
  return (
    <div ref={ref}>
      <AdSlot placement={placement} onReward={onReward} onClose={onClose} />
    </div>
  );
}

const VIEWS_KEY = "ww.rewarded.views";
function viewsToday(): number {
  try {
    const v = JSON.parse(localStorage.getItem(VIEWS_KEY) ?? "{}") as { d?: string; n?: number };
    return v.d === new Date().toDateString() ? (v.n ?? 0) : 0;
  } catch {
    return 0;
  }
}
function countView() {
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify({ d: new Date().toDateString(), n: viewsToday() + 1 }));
  } catch {}
}

/**
 * rewarded_shield (opt-in, 3 views a day; the store caps grants at 2 a week).
 * Falls back to a 5-second house card when no ad provider renders.
 */
export function RewardedShield({ onGrant }: { onGrant: () => Promise<void> }) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [house, setHouse] = useState(false);
  const [left, setLeft] = useState(5);
  const [, setViews] = useState(0);

  useEffect(() => {
    if (!open || !house) return;
    const id = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [open, house]);

  if (!mounted || viewsToday() >= 3) return null;

  const grant = async () => {
    countView();
    setOpen(false);
    setViews((n) => n + 1);
    await onGrant();
  };

  return (
    <>
      <button type="button" className="press min-h-[44px] w-full text-[15px] leading-5 text-text-2" onClick={() => { setHouse(false); setLeft(5); setOpen(true); }}>
        Earn a streak shield: watch a short ad
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="STREAK SHIELD" description="A shield covers one missed check-in. It never covers a reset.">
        {!house && <AdProbe placement="rewarded_shield" onEmpty={() => setHouse(true)} onReward={grant} onClose={() => setOpen(false)} />}
        {house && (
          <div>
            <div className="rounded-card border border-dashed border-[var(--hairline)] p-5">
              <p className="text-[13px] leading-[18px] text-text-2">Sponsored</p>
              <p className="mt-2 text-[17px] leading-[22px] font-semibold">WillWar Pro</p>
              <p className="mt-1 text-[15px] leading-5 text-text-2">Combos, the coach, two shields a month and no ads.</p>
            </div>
            <Button className="mt-5" disabled={left > 0} onClick={grant}>
              {left > 0 ? `Shield in ${left}` : "Claim my shield"}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}

/** post_round interstitial: once per session, only from "Go another round". */
export function PostRoundGate({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-bg pt-safe pb-safe">
      <div className="flex h-11 items-center justify-end px-2">
        <button type="button" className="press min-h-[44px] px-3 text-[17px]" onClick={() => { setShow(false); onDone(); }}>
          Close
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <AdProbe placement="post_round" onEmpty={() => { setShow(false); onDone(); }} onClose={() => { setShow(false); onDone(); }} />
      </div>
    </div>
  );
}
