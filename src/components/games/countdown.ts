/**
 * Round countdown math. Computed from timestamps with pause offsets, never a
 * decrementing counter, so it stays right if the tab is throttled or the phone sleeps.
 */
export const ROUND_MS = 180_000;
export const AMBER_MS = 30_000;

export type RoundClock = { startedAt: number; pausedAt: number | null; pausedMs: number; durationMs: number };

export function startClock(now: number, durationMs = ROUND_MS): RoundClock {
  return { startedAt: now, pausedAt: null, pausedMs: 0, durationMs };
}

export function pauseClock(c: RoundClock, now: number): RoundClock {
  return c.pausedAt !== null ? c : { ...c, pausedAt: now };
}

export function resumeClock(c: RoundClock, now: number): RoundClock {
  return c.pausedAt === null ? c : { ...c, pausedAt: null, pausedMs: c.pausedMs + Math.max(0, now - c.pausedAt) };
}

export function activeMs(c: RoundClock, now: number): number {
  return Math.max(0, (c.pausedAt ?? now) - c.startedAt - c.pausedMs);
}

export function remainingMs(c: RoundClock, now: number): number {
  return Math.max(0, c.durationMs - activeMs(c, now));
}

export type RoundPhase = "on" | "warn" | "done";
/** Green lamp while the round is on; amber for the last 30 seconds; done at 0:00. */
export function phaseOf(remaining: number): RoundPhase {
  if (remaining <= 0) return "done";
  return remaining <= AMBER_MS ? "warn" : "on";
}

/** Whole seconds shown on the LED. Rounds up so a fresh round reads 3:00 and 0:00 only at the end. */
export function display(remaining: number): { m: number; s: number } {
  const secs = Math.ceil(Math.max(0, remaining) / 1000);
  return { m: Math.floor(secs / 60), s: secs % 60 };
}
