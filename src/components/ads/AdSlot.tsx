"use client";
/**
 * Ad placement contract (Part 6.9, 7.5). Allowlisted placements and routes only; Pro renders
 * nothing. Never between a person and Go a round.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { placementAllowed, REWARDED_VIEWS_PER_DAY, type Placement } from "@/lib/config/ads";
import { sponsorFor } from "@/lib/config/sponsors";
import { HouseAd } from "./HouseAd";
import { DisplayAd } from "./providers";

export type { Placement };

export function AdSlot(props: { placement: Placement; pro?: boolean; onReward?: () => void; onClose?: () => void }) {
  const path = usePathname() ?? "";
  if (props.pro || !placementAllowed(props.placement, path)) return null;
  switch (props.placement) {
    case "learn_feed":
    case "learn_article_end":
      return <DisplayAd slotKey={`${props.placement}:${path}`} />;
    case "rewarded_shield":
      return <RewardedShield onReward={props.onReward} />;
    case "post_round":
      return <PostRound onClose={props.onClose} />;
  }
}

const VIEWS_KEY = "ww.ads.rewardedViews";
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function readViews(): number {
  try {
    const v = JSON.parse(localStorage.getItem(VIEWS_KEY) ?? "null") as { d: string; n: number } | null;
    return v && v.d === todayKey() ? v.n : 0;
  } catch {
    return 0;
  }
}
function addView() {
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify({ d: todayKey(), n: readViews() + 1 }));
  } catch {}
}

/** Opt-in rewarded house ad: 5 seconds, then onReward(). 3 views a day on this device. */
function RewardedShield({ onReward }: { onReward?: () => void }) {
  const [capped, setCapped] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(5);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Storage is client-only; read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCapped(readViews() >= REWARDED_VIEWS_PER_DAY);
  }, []);

  useEffect(() => {
    if (!open) return;
    timer.current = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [open]);

  if (capped !== false) return null;

  const start = () => {
    setLeft(5);
    setOpen(true);
  };
  const finish = () => {
    addView();
    setOpen(false);
    setCapped(readViews() >= REWARDED_VIEWS_PER_DAY);
    onReward?.();
  };

  return (
    <>
      <Button variant="plain" className="w-full text-text-2" onClick={start}>
        Earn a streak shield: watch a short ad
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="A SHORT AD" description="Stay for five seconds and the shield is yours.">
        <HouseAd sponsor={sponsorFor("rewarded")} />
        <div className="mt-5">
          <Button disabled={left > 0} onClick={finish}>
            {left > 0 ? `Shield in ${left}` : "Collect my shield"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

const SESSION_KEY = "ww.ads.postRoundShown";

/** Interstitial at a natural break, once per session. Calls onClose when dismissed or skipped. */
function PostRound({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
    if (shown) {
      done.current = true;
      onClose?.();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => {
    setOpen(false);
    if (!done.current) {
      done.current = true;
      onClose?.();
    }
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title="BETWEEN ROUNDS">
      <HouseAd sponsor={sponsorFor("post_round")} onClick={close} />
      <div className="mt-5">
        <Button variant="secondary" onClick={close}>Continue</Button>
      </div>
    </Sheet>
  );
}
