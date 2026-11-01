"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Globe } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/Button";
import { Cell, CellGroup } from "@/components/ui/Cell";
import { Screen } from "@/components/ui/Screen";
import { GlovesOnHook } from "@/components/illustrations";
import { isPro } from "@/lib/store/engine";
import type { Camp } from "@/lib/store/types";
import { JoinSheet, StartCampSheet } from "./sheets";

/** C1 empty state, or the list of camps. */
export function CampList() {
  const { store, snap, loading } = useApp();
  const router = useRouter();
  const [camps, setCamps] = useState<Camp[] | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setCamps(await store.listCamps());
    } catch {
      setCamps([]);
    }
  }, [store]);

  useEffect(() => {
    // Fetch once the profile exists; setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (snap) void load();
  }, [snap, load]);

  const owned = camps?.filter((c) => c.ownerId === snap?.profile.id).length ?? 0;
  const pro = !!snap && isPro(snap.entitlement, new Date());
  const go = (id: string) => {
    setStartOpen(false);
    setJoinOpen(false);
    router.push(`/app/camp/${id}`);
  };

  return (
    <Screen title="CAMP">
      {loading || !snap || camps === null ? (
        <div className="space-y-3" aria-busy="true">
          <div className="skeleton h-[52px]" />
          <div className="skeleton h-[52px]" />
        </div>
      ) : camps.length === 0 ? (
        <div className="flex flex-col items-center pt-8 text-center">
          <GlovesOnHook size={112} className="text-text-2" />
          <p className="mt-6 max-w-[300px] text-[17px] leading-[22px]">No camp yet. A camp is a few friends who see each other&apos;s streaks.</p>
          <div className="mt-8 w-full space-y-3">
            <Button onClick={() => setStartOpen(true)}>Start a camp</Button>
            <Button variant="secondary" onClick={() => setJoinOpen(true)}>Join with a code</Button>
          </div>
        </div>
      ) : (
        <>
          <CellGroup header="Your camps">
            {camps.map((c) => (
              <Cell key={c.id} title={c.name} subtitle={c.ownerId === snap.profile.id ? "You run this camp" : undefined} href={`/app/camp/${c.id}`} />
            ))}
          </CellGroup>
          <CellGroup header="Season">
            <Cell icon={<Globe size={22} weight="bold" />} title="Global board" subtitle="Opt-in. Top 100 handles." href="/app/camp/global" />
          </CellGroup>
          <div className="mt-6 space-y-3">
            <Button variant="secondary" onClick={() => setStartOpen(true)}>Start a camp</Button>
            <Button variant="plain" className="w-full" onClick={() => setJoinOpen(true)}>Join with a code</Button>
          </div>
        </>
      )}
      <StartCampSheet open={startOpen} onOpenChange={setStartOpen} needsPro={!pro && owned >= 1} onCreated={go} />
      <JoinSheet open={joinOpen} onOpenChange={setJoinOpen} onJoined={go} />
    </Screen>
  );
}
