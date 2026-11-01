"use client";
import { useEffect, useState } from "react";
import { fallbackLine } from "@/lib/ai/fallback";
import type { CornerContext } from "@/lib/ai/prompts";

export type CornerTalkProps = {
  day: number;
  goalDays: number;
  seasonName: string | null;
  tone: CornerContext["tone"];
  why: string[];
  checkins7: number;
  rounds7: number;
  weekday: CornerContext["weekday"];
};

/**
 * The daily corner talk card. Skeleton while loading; never shows an error.
 * Offline or on any failure it shows a curated line computed on the device.
 * Only the allowed context is sent to /api/corner.
 */
export function CornerTalk(props: CornerTalkProps) {
  const [text, setText] = useState<string | null>(null);
  const { day, goalDays, seasonName, tone, checkins7, rounds7, weekday } = props;
  const why = props.why.slice(0, 3).join(",");

  useEffect(() => {
    let alive = true;
    const ctx: CornerContext = {
      day,
      goalDays,
      seasonName,
      tone,
      why: why ? why.split(",") : [],
      checkins7: Math.min(7, Math.max(0, checkins7)),
      rounds7: Math.max(0, rounds7),
      weekday,
    };
    const key = `ww.corner.${tone}.${day}.${weekday}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        // Hydrating from the per-tab cache after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setText(cached);
        return;
      }
    } catch {}
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 9000);
    fetch("/api/corner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ctx), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ text: string }>) : Promise.reject(new Error(String(r.status)))))
      .then((d) => d.text)
      .catch(() => fallbackLine(ctx, `${weekday}|${day}`))
      .then((t) => {
        if (!alive) return;
        setText(t);
        try {
          sessionStorage.setItem(key, t);
        } catch {}
      })
      .finally(() => clearTimeout(timer));
    return () => {
      alive = false;
      clearTimeout(timer);
      ac.abort();
    };
  }, [day, goalDays, seasonName, tone, why, checkins7, rounds7, weekday]);

  return (
    <section aria-labelledby="corner-title" className="rounded-card bg-raised p-5">
      <h2 id="corner-title" className="text-[13px] leading-[18px] text-text-2">
        Corner talk
      </h2>
      {text ? (
        <p className="mt-2 text-[17px] leading-[22px]">{text}</p>
      ) : (
        <div className="mt-3 space-y-2" aria-label="Loading corner talk">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/5" />
        </div>
      )}
    </section>
  );
}
