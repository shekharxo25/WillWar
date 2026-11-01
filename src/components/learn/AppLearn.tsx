"use client";
import { useApp, useNow } from "@/components/AppProvider";
import { AdSlot, type Placement } from "@/components/ads/AdSlot";
import { isPro } from "@/lib/store/engine";
import type { ArticleCardData } from "@/lib/learn/articles";
import { LearnFeed } from "./LearnFeed";

function usePro(): boolean {
  const { snap } = useApp();
  const now = useNow(60_000);
  return !!snap && !!now && isPro(snap.entitlement, now);
}

/** In-app feed: hides Sponsored cards for Pro. */
export function AppLearnFeed({ articles }: { articles: ArticleCardData[] }) {
  return <LearnFeed articles={articles} basePath="/app/learn" pro={usePro()} />;
}

export function AppAdSlot({ placement }: { placement: Placement }) {
  return <AdSlot placement={placement} pro={usePro()} />;
}
