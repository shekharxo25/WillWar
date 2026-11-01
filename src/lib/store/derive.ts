import { SEASON } from "@/lib/config/season";
import { addDays, bestStreakMs, daysBetween, goalLength, localDate, streakDay, tallyCount, zonedMidnight } from "@/lib/time";
import { isPro, openStreak } from "./engine";
import type { Snapshot } from "./types";

export type TodayView = {
  today: string;
  preseason: boolean;
  countdownTo: Date | null;
  streakStart: Date | null;
  day: number;
  goalDays: number;
  endsOn: string | null;
  checkedIn: boolean;
  strokes: number;
  paused: boolean;
  bestS: number;
  pro: boolean;
  shieldsLeft: number;
  missedDays: string[];
  goalOver: boolean;
};

export function todayView(s: Snapshot, now: Date): TodayView {
  const tz = s.profile.timezone;
  const today = localDate(now, tz);
  const open = openStreak(s);
  const start = open ? new Date(open.startedAt) : null;
  const preseason = !!start && start > now;
  const goal = s.goal;
  const from = goal?.startDate;
  const to = goal?.endsOn;
  const checkins = s.checkins;
  const last = checkins.filter((c) => c.status !== "reset").map((c) => c.localDate).sort().at(-1) ?? null;
  const missedDays: string[] = [];
  if (start && !preseason) {
    const startDate = localDate(start, tz);
    for (let i = 1; i <= 3; i++) {
      const d = addDays(today, -i);
      if (d >= startDate && !checkins.some((c) => c.localDate === d)) missedDays.push(d);
    }
  }
  return {
    today,
    preseason,
    countdownTo: preseason ? start : null,
    streakStart: start,
    day: start ? streakDay(start, now) : 0,
    goalDays: goal ? goalLength(goal.startDate, goal.endsOn) : 30,
    endsOn: goal?.endsOn ?? null,
    checkedIn: checkins.some((c) => c.localDate === today && c.status !== "reset"),
    strokes: Math.min(30, tallyCount(checkins, from, to)),
    paused: !preseason && !!start && (last ? daysBetween(last, today) >= 2 : daysBetween(localDate(start, tz), today) >= 2),
    bestS: Math.floor(bestStreakMs(s.streaks, now) / 1000),
    pro: isPro(s.entitlement, now),
    shieldsLeft: s.shields.filter((x) => !x.usedOn).length,
    missedDays,
    goalOver: !!goal && goal.endsOn < today,
  };
}

export function seasonStartFor(tz: string) {
  return zonedMidnight(SEASON.startsOn, tz);
}

export function roundsLasted(s: Snapshot): number {
  return s.urgeSessions.filter((u) => u.completed).length;
}

export function averageDrop(s: Snapshot): number | null {
  const pairs = s.urgeSessions.filter((u) => u.intensityBefore !== null && u.intensityAfter !== null);
  if (!pairs.length) return null;
  return pairs.reduce((a, u) => a + (u.intensityBefore! - u.intensityAfter!), 0) / pairs.length;
}

export function triggerCounts(s: Snapshot): { tag: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of s.resets) for (const t of r.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
