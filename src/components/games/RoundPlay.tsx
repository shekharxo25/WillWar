"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Paywall } from "@/components/pro/Paywall";
import { isPro } from "@/lib/store/engine";
import type { Game } from "@/lib/store/types";
import { RoundHost } from "./RoundHost";
import { useMounted } from "./useMounted";

/** Gate for /app/round/[game]: Combos is Pro (the database rejects free Combos rows too). */
export function RoundPlay({ game }: { game: Game }) {
  const { snap, loading } = useApp();
  const router = useRouter();
  const mounted = useMounted();

  if (!mounted || loading) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  const locked = game === "combos" && !(snap && isPro(snap.entitlement, new Date()));
  if (locked)
    return (
      <div className="min-h-dvh bg-bg">
        <Sheet open onOpenChange={() => router.replace("/app/round?again=1")} title="WILLWAR PRO" description="Combos is part of Pro. Kitbag and Bag stay free." detent="large">
          <Paywall source="feature" onContinueFree={() => router.replace("/app/round?again=1")} />
        </Sheet>
      </div>
    );
  return <RoundHost game={game} />;
}
