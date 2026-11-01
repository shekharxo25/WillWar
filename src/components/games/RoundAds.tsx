"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { placementAllowed } from "@/lib/config/ads";

/** rewarded_shield (opt-in; AdSlot caps views at 3 a day, the store caps grants at 2 a week). */
export function RewardedShield({ onGrant }: { onGrant: () => Promise<void> }) {
  return <AdSlot placement="rewarded_shield" onReward={() => void onGrant()} />;
}

/** post_round interstitial: once per session, only from "Go another round". Skips straight on when not allowed. */
export function PostRoundGate({ onDone }: { onDone: () => void }) {
  const path = usePathname() ?? "";
  const allowed = placementAllowed("post_round", path);
  useEffect(() => {
    if (!allowed) onDone();
  }, [allowed, onDone]);
  return allowed ? <AdSlot placement="post_round" onClose={onDone} /> : null;
}
