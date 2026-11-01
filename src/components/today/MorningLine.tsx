"use client";

import { SunHorizon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/List";
import { pickFallbackLine } from "@/lib/ai/fallback";
import type { Snapshot } from "@/lib/domain/types";
import { dayNumber, today } from "@/lib/store/snapshot";

/** The daily morning line. Device mode and offline use curated lines; cloud asks the server. */
export function MorningLine({ snapshot }: { snapshot: Snapshot }) {
  const day = dayNumber(snapshot);
  const date = today(snapshot);
  const fallback = pickFallbackLine({ tone: snapshot.profile.tone, day, seed: `${snapshot.profile.id}:${date}` });
  const [remote, setRemote] = useState<string | null>(null);
  const text = snapshot.mode === "device" ? fallback : remote;

  useEffect(() => {
    if (snapshot.mode === "device") return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    fetch("/api/affirmation", { method: "POST", signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ text?: unknown }>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => !cancelled && setRemote(typeof d.text === "string" && d.text ? d.text : fallback))
      .catch(() => !cancelled && setRemote(fallback))
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [snapshot.mode, fallback]);

  return (
    <section className="rounded-sheet bg-surface p-5" aria-busy={text === null}>
      <h2 className="flex items-center gap-1.5 text-footnote font-semibold text-label-2">
        <SunHorizon size={16} weight="fill" className="text-tide" aria-hidden />
        Morning line
      </h2>
      {text === null ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <p className="mt-2 text-body">{text}</p>
      )}
    </section>
  );
}
