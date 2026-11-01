"use client";

import { useEffect, useState } from "react";
import { Tide } from "@/components/tide/Tide";
import { MILESTONES } from "@/lib/domain/constants";
import { bestStreakMs } from "@/lib/domain/rules";
import type { Snapshot } from "@/lib/domain/types";
import { dayNumber, hasStarted, level, streakStart } from "@/lib/store/snapshot";
import {
  clockAriaLabel,
  formatClock,
  formatCountdown,
  formatInstantShort,
  goalEndInstant,
  MS_DAY,
  milestonesReached,
} from "@/lib/time";

/** The milestone reached within the last day, if any (drives the once-a-day brass ring). */
function freshMilestone(elapsedMs: number): number | null {
  const reached = milestonesReached(elapsedMs);
  const last = reached[reached.length - 1];
  return last && elapsedMs - last * MS_DAY < MS_DAY ? last : null;
}

export function TideCard({ snapshot, now, still }: { snapshot: Snapshot; now: Date; still?: boolean }) {
  const start = streakStart(snapshot);
  const started = hasStarted(snapshot, now);
  const tz = snapshot.profile.timezone;
  const elapsed = start && started ? Math.max(0, now.getTime() - start.getTime()) : 0;
  // A visible waterline from the first second, so Day 1 still reads as water.
  const water = started ? Math.max(0.1, level(snapshot, now)) : 0.04;
  const goalSpan = start && snapshot.goal ? goalEndInstant(snapshot.goal.endsOn, tz).getTime() - start.getTime() : 30 * MS_DAY;
  const milestone = freshMilestone(elapsed);
  // The brass ring and glint play once per milestone: read "seen" at mount, record it after.
  const ringKey = milestone ? `ww-milestone-${milestone}-${start?.getTime()}` : null;
  const [ringSeen] = useState(() => {
    if (!ringKey) return true;
    try {
      return Boolean(localStorage.getItem(ringKey));
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!ringKey) return;
    try {
      localStorage.setItem(ringKey, "1");
    } catch {
      // storage unavailable: the ring may show again next time
    }
  }, [ringKey]);

  const best = Math.max(bestStreakMs(snapshot.streaks, now), 0);
  const clock = started ? formatClock(elapsed) : start ? formatCountdown(start.getTime() - now.getTime()) : "—";
  const minuteLabel = started ? clockAriaLabel(elapsed) : `Starts in ${clock}`;
  const day = dayNumber(snapshot, now);
  const goalDays = snapshot.goal && start ? Math.max(1, Math.round(goalSpan / MS_DAY)) : 30;

  const clockBlock = (white: boolean) => (
    <div className="flex h-full flex-col items-center justify-center pr-12 pl-5 text-center">
      {started ? (
        <p className={`num text-[clamp(1.55rem,7.5vw,2.9rem)] leading-none font-semibold tracking-tight whitespace-nowrap ${white ? "text-white" : "text-label"}`}>
          {clock}
        </p>
      ) : (
        <>
          <p className={`text-subhead ${white ? "text-white/80" : "text-label-2"}`}>Starts in</p>
          <p className={`num mt-1 text-clock font-semibold ${white ? "text-white" : "text-label"}`}>{clock}</p>
        </>
      )}
    </div>
  );

  return (
    <section
      aria-label="Your streak"
      className={`relative h-80 overflow-hidden rounded-sheet bg-linear-to-b from-surface to-tide-wash ${milestone && !ringSeen ? "ring-2 ring-brass" : ""}`}
    >
      <div className="absolute inset-0">
        <Tide level={water} still={still || !started} />
      </div>

      {/* Two clipped copies: label colour above the waterline, white below it. */}
      <div className="absolute inset-0" aria-hidden>
        {clockBlock(false)}
      </div>
      <div className="absolute inset-0" aria-hidden style={{ clipPath: `inset(${(1 - water) * 100}% 0 0 0)` }}>
        {clockBlock(true)}
      </div>
      <p className="sr-only" aria-live="off">
        {minuteLabel}
      </p>

      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className="rounded-full bg-tide-wash px-2.5 py-1 text-footnote font-semibold text-tide">
          {started ? `Day ${day} of ${goalDays}` : "Before the start"}
        </span>
      </div>

      {/* Milestone ticks on the right edge at 7, 14, 21, 30. */}
      <ol className="absolute top-0 right-3 bottom-0" aria-label="Milestones">
        {MILESTONES.map((m) => {
          const raw = (m * MS_DAY) / goalSpan;
          if (raw > 1.05) return null; // a milestone well past the goal end isn't shown
          const pos = Math.min(0.9, raw);
          const passed = elapsed >= m * MS_DAY;
          return (
            <li
              key={m}
              className="absolute right-0 flex items-center gap-1.5"
              style={{ bottom: `calc(${pos * 100}% - 8px)` }}
              aria-label={`Day ${m}${passed ? ", reached" : ""}`}
            >
              <span className={`num text-[11px] font-semibold ${passed ? "text-brass-ink" : pos > 1 - water ? "text-white/80" : "text-label-3"}`}>
                {m}
              </span>
              <span className={`block h-0.5 w-3 rounded-full ${passed ? "bg-brass" : "bg-label-3"}`} />
            </li>
          );
        })}
      </ol>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3.5 text-footnote">
        <span className={water >= 0.1 ? "text-white/85" : "text-label-2"}>
          {start ? (started ? `Started ${formatInstantShort(start, tz)}` : `Starts ${formatInstantShort(start, tz)}`) : ""}
        </span>
        {best > MS_DAY && (
          <span className={water >= 0.1 ? "text-white/85" : "text-label-2"}>Best: {Math.floor(best / MS_DAY)} days</span>
        )}
      </div>

      {milestone && !ringSeen && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-sheet motion-reduce:hidden" aria-hidden>
          <div className="absolute inset-y-0 w-1/4 bg-linear-to-r from-transparent via-white/45 to-transparent motion-safe:animate-[glint_1.2s_ease-out_1]" />
        </div>
      )}
    </section>
  );
}
