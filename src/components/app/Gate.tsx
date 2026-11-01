"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Snapshot } from "@/lib/domain/types";
import { useWillWar } from "@/lib/store/provider";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/List";

/**
 * Renders children only once the person has finished onboarding. Signed-out and
 * new people go to onboarding (which links to sign-in for returning people).
 */
export function Gate({ children, fallback }: { children: (s: Snapshot) => ReactNode; fallback?: ReactNode }) {
  const { status, snapshot, refresh } = useWillWar();
  const router = useRouter();

  useEffect(() => {
    if (status === "needs-onboarding" || status === "signed-out") router.replace("/app/start");
  }, [status, router]);

  if (status === "ready" && snapshot) return <>{children(snapshot)}</>;
  if (status === "error") {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+64px)] text-center">
        <p className="text-body">We couldn&apos;t load your streak. Check your connection and try again.</p>
        <Button className="mt-4" onClick={() => void refresh()}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    fallback ?? (
      <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+56px)]" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-80 w-full rounded-sheet" />
        <Skeleton className="h-[50px] w-full rounded-btn" />
      </div>
    )
  );
}
