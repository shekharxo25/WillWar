/**
 * Device engine: the same rules as the database functions in supabase/migrations,
 * applied to an on-device state object. Pure: every function takes state + now and
 * returns new state (or throws StoreError with the same codes the RPCs raise).
 * Unit tested in src/lib/store/engine.test.ts.
 */
import { SEASON } from "@/lib/config/season";
import { CAUSES } from "@/lib/config/causes";
import { FREE_CAMP_MAX, PRO_CAMP_MAX } from "@/lib/config/plans";
import { addDays, bestStreakMs, daysBetween, localDate, localHour, seasonWindow, isValidTimeZone, zonedMidnight } from "@/lib/time";
import type {
  BoardRow, Camp, Challenge, ChallengeKind, Checkin, Entitlement, Goal, NudgeKey, OnboardingInput, Preferences,
  Profile, Reset, ResetTag, Shield, Snapshot, Streak, UrgeSession, WarChest, WarChestEvent,
} from "./types";
import { StoreError } from "./types";
import { RESET_TAGS } from "./types";

export type DemoMember = { id: string; handle: string; avatarSeed: string; startedAt: string; bestS: number; daysKept: number; lastCheckin: string | null };

export type DeviceState = Snapshot & {
  version: 1;
  camps: (Camp & { members: string[]; demoMembers: DemoMember[] })[];
  challenges: Challenge[];
  nudges: { campId: string; to: string; key: NudgeKey; at: string }[];
  events: { name: string; at: string }[];
};

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
const iso = (d: Date) => d.toISOString();

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function hex(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

export function isAdult(birthDate: string, now: Date): boolean {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return false;
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate()));
  return Date.UTC(y, m - 1, d) <= cutoff.getTime();
}

export function isPro(e: Entitlement | null, now: Date): boolean {
  return !!e && e.status === "active" && (!e.currentPeriodEnd || new Date(e.currentPeriodEnd) > now);
}

export function openStreak(s: Pick<Snapshot, "streaks">): Streak | null {
  return s.streaks.find((x) => x.endedAt === null) ?? null;
}

export function today(s: Pick<Snapshot, "profile">, now: Date): string {
  return localDate(now, s.profile.timezone);
}

/** complete_onboarding */
export function completeOnboarding(input: OnboardingInput, now: Date): DeviceState {
  if (!input.birthDate || !isAdult(input.birthDate, now)) throw new StoreError("must_be_18");
  if (!isValidTimeZone(input.timezone)) throw new StoreError("bad_timezone");
  const handle = input.handle.toLowerCase();
  if (!HANDLE_RE.test(handle)) throw new StoreError("bad_handle");
  const tday = localDate(now, input.timezone);
  let endsOn: string;
  let seasonStart: Date | null = null;
  if (input.seasonId) {
    if (input.seasonId !== SEASON.id) throw new StoreError("bad_season");
    if (SEASON.endsOn < tday) throw new StoreError("season_over");
    seasonStart = zonedMidnight(SEASON.startsOn, input.timezone);
    endsOn = SEASON.endsOn;
  } else {
    if (!input.endsOn || input.endsOn <= tday || daysBetween(tday, input.endsOn) > 365) throw new StoreError("bad_end_date");
    endsOn = input.endsOn;
  }
  const started = new Date(input.startedAt).getTime();
  const nowMs = now.getTime();
  const upper = Math.max(nowMs, seasonStart?.getTime() ?? nowMs);
  const lower = Math.min(nowMs - 48 * 3600_000, seasonStart?.getTime() ?? nowMs - 48 * 3600_000);
  if (started > upper + 1000 || started < lower - 1000) throw new StoreError("start_out_of_range");

  const profile: Profile = {
    id: uid(),
    handle,
    avatarSeed: hex(12),
    timezone: input.timezone,
    tone: input.tone,
    whyTags: input.why.slice(0, 3),
    discreetNotifications: true,
    leaderboardVisibility: "camps",
    showBackedBadge: false,
    warChestOfferedAt: null,
    createdAt: iso(now),
    country: input.country ?? null,
  };
  const startDate = localDate(new Date(Math.max(started, seasonStart?.getTime() ?? started)), input.timezone);
  const goal: Goal = {
    id: uid(),
    seasonId: input.seasonId,
    startDate: input.seasonId ? SEASON.startsOn : startDate,
    endsOn,
    pledgeSignedAt: input.pledgeSigned ? iso(now) : null,
    createdAt: iso(now),
    closedAt: null,
  };
  return {
    version: 1,
    profile,
    streaks: [{ id: uid(), startedAt: new Date(started).toISOString(), endedAt: null }],
    checkins: [],
    resets: [],
    urgeSessions: [],
    goal,
    shields: [],
    entitlement: null,
    warChest: null,
    warChestEvents: [],
    camps: [],
    challenges: [],
    nudges: [],
    events: [],
  };
}

/** check_in: server (here: device clock in the profile timezone) decides the date. Idempotent. */
export function checkIn(s: DeviceState, now: Date): DeviceState {
  const open = openStreak(s);
  if (!open || new Date(open.startedAt) > now) throw new StoreError("no_open_streak");
  const d = today(s, now);
  if (s.checkins.some((c) => c.localDate === d)) return s;
  return { ...s, checkins: [...s.checkins, { localDate: d, status: "held", createdAt: iso(now) }] };
}

export function forfeitFor(chest: WarChest): number {
  return chest.forfeitRule === "strict"
    ? chest.amountMinor - chest.forfeitedMinor
    : Math.min(Math.floor(chest.amountMinor / 4), chest.amountMinor - chest.forfeitedMinor);
}

/** log_reset: ends the open streak, records tags only, starts a new streak, applies War Chest forfeit. */
export function logReset(s: DeviceState, tags: ResetTag[], now: Date): { state: DeviceState; forfeit: number } {
  const allowed = new Set(RESET_TAGS.map((t) => t.key));
  if (tags.some((t) => !allowed.has(t))) throw new StoreError("bad_tags");
  const d = today(s, now);
  const streaks = s.streaks.map((x) => (x.endedAt === null ? { ...x, endedAt: iso(now) } : x));
  streaks.push({ id: uid(), startedAt: iso(now), endedAt: null });
  const reset: Reset = { id: uid(), occurredAt: iso(now), tags: [...new Set(tags)] };
  const checkins: Checkin[] = s.checkins.filter((c) => c.localDate !== d);
  checkins.push({ localDate: d, status: "reset", createdAt: iso(now) });
  let warChest = s.warChest;
  let events = s.warChestEvents;
  let forfeit = 0;
  if (warChest && warChest.status === "active" && s.goal && !s.goal.closedAt && warChest.goalId === s.goal.id) {
    forfeit = forfeitFor(warChest);
    if (forfeit > 0) {
      warChest = { ...warChest, forfeitedMinor: warChest.forfeitedMinor + forfeit };
      events = [...events, { id: uid(), kind: warChest.mode === "stake" ? "forfeit" : "promise_forfeit", amountMinor: forfeit, createdAt: iso(now) }];
    }
  }
  return { state: { ...s, streaks, checkins, resets: [...s.resets, reset], warChest, warChestEvents: events }, forfeit };
}

/** use_shield: covers a missed day (yesterday back to 3 days) inside the open streak. Never a reset. */
export function spendShield(s: DeviceState, date: string, now: Date): DeviceState {
  const t = today(s, now);
  if (date >= t || date < addDays(t, -3)) throw new StoreError("shield_window");
  if (s.checkins.some((c) => c.localDate === date)) throw new StoreError("already_recorded");
  const open = openStreak(s);
  if (!open || localDate(new Date(open.startedAt), s.profile.timezone) > date) throw new StoreError("not_in_streak");
  const shield = [...s.shields].filter((x) => !x.usedOn).sort((a, b) => a.grantedAt.localeCompare(b.grantedAt))[0];
  if (!shield) throw new StoreError("no_shield");
  return {
    ...s,
    shields: s.shields.map((x) => (x.id === shield.id ? { ...x, usedOn: date } : x)),
    checkins: [...s.checkins, { localDate: date, status: "shielded", createdAt: iso(now) }],
  };
}

/** Rewarded shields are capped at 2 a week (same as the database). */
export function grantShield(s: DeviceState, source: Shield["source"], now: Date): DeviceState {
  if (source === "rewarded_ad") {
    const weekAgo = now.getTime() - 7 * 86400_000;
    const recent = s.shields.filter((x) => x.source === "rewarded_ad" && new Date(x.grantedAt).getTime() > weekAgo).length;
    if (recent >= 2) throw new StoreError("shield_cap");
  }
  return { ...s, shields: [...s.shields, { id: uid(), source, grantedAt: iso(now), usedOn: null }] };
}

export function saveUrgeSession(s: DeviceState, u: Omit<UrgeSession, "id">, now: Date): DeviceState {
  if (u.game === "combos" && !isPro(s.entitlement, now)) throw new StoreError("pro_required");
  if (u.durationS < 0 || u.durationS > 1800) throw new StoreError("bad_duration");
  for (const v of [u.intensityBefore, u.intensityAfter]) if (v !== null && (v < 1 || v > 10)) throw new StoreError("bad_intensity");
  return { ...s, urgeSessions: [...s.urgeSessions, { ...u, id: uid() }] };
}

export function signPledge(s: DeviceState, now: Date): DeviceState {
  if (!s.goal || s.goal.closedAt || s.goal.pledgeSignedAt) return s;
  return { ...s, goal: { ...s.goal, pledgeSignedAt: iso(now) } };
}

export function updatePreferences(s: DeviceState, p: Preferences): DeviceState {
  const next = { ...s.profile, ...p };
  if (p.whyTags) next.whyTags = p.whyTags.slice(0, 3);
  return { ...s, profile: next };
}

/** start_goal */
export function startGoal(s: DeviceState, endsOn: string | null, seasonId: string | null, now: Date): DeviceState {
  const t = today(s, now);
  const closed = closeFinishedGoal(s, now);
  if (closed.goal && !closed.goal.closedAt) throw new StoreError("goal_open");
  let end: string;
  if (seasonId) {
    if (seasonId !== SEASON.id || SEASON.endsOn < t) throw new StoreError("bad_season");
    end = SEASON.endsOn;
  } else {
    if (!endsOn || endsOn <= t || daysBetween(t, endsOn) > 365) throw new StoreError("bad_end_date");
    end = endsOn;
  }
  const goal: Goal = { id: uid(), seasonId, startDate: seasonId ? (SEASON.startsOn > t ? SEASON.startsOn : t) : t, endsOn: end, pledgeSignedAt: null, createdAt: iso(now), closedAt: null };
  return { ...closed, goal };
}

/** Part of settle_due_war_chests: goals close after their last local day; promise chests settle. */
export function closeFinishedGoal(s: DeviceState, now: Date): DeviceState {
  if (!s.goal || s.goal.closedAt) return s;
  if (s.goal.endsOn >= today(s, now)) return s;
  const goal = { ...s.goal, closedAt: iso(now) };
  let warChest = s.warChest;
  let events = s.warChestEvents;
  if (warChest && warChest.goalId === goal.id && warChest.status === "active" && warChest.mode === "promise") {
    warChest = { ...warChest, status: "settled", settledAt: iso(now) };
    events = [...events, { id: uid(), kind: "settled", amountMinor: 0, createdAt: iso(now) }];
  }
  return { ...s, goal, warChest, warChestEvents: events };
}

/** war_chest_offer_eligible */
export function warChestOfferEligible(s: DeviceState, now: Date): boolean {
  const g = s.goal;
  if (!g || g.closedAt || s.profile.warChestOfferedAt || !g.pledgeSignedAt) return false;
  if (daysBetween(today(s, now), g.endsOn) < 7) return false;
  const h = localHour(now, s.profile.timezone);
  if (h < 6 || h > 22) return false;
  if (!s.checkins.some((c) => c.status === "held")) return false;
  if (s.warChest && s.warChest.goalId === g.id) return false;
  const weekAgo = now.getTime() - 7 * 86400_000;
  if (s.events.some((e) => e.name === "crisis_card_shown" && new Date(e.at).getTime() > weekAgo)) return false;
  return true;
}

export function markWarChestOffered(s: DeviceState, now: Date): DeviceState {
  if (s.profile.warChestOfferedAt) return s;
  return { ...s, profile: { ...s.profile, warChestOfferedAt: iso(now) } };
}

export function validChestAmount(amountMinor: number, currency: "INR" | "USD"): boolean {
  if (!Number.isInteger(amountMinor)) return false;
  return currency === "INR" ? amountMinor >= 4900 && amountMinor <= 500000 : amountMinor >= 200 && amountMinor <= 10000;
}

/** create_promise_chest: no money moves. */
export function createPromiseChest(s: DeviceState, amountMinor: number, currency: "INR" | "USD", rule: "steady" | "strict", causeId: string, now: Date): DeviceState {
  if (!s.goal || s.goal.closedAt) throw new StoreError("no_open_goal");
  if (!CAUSES.some((c) => c.id === causeId)) throw new StoreError("bad_cause");
  if (!validChestAmount(amountMinor, currency)) throw new StoreError("chest_amount_range");
  if (rule !== "steady" && rule !== "strict") throw new StoreError("bad_rule");
  if (s.warChest && s.warChest.goalId === s.goal.id) throw new StoreError("chest_exists");
  const chest: WarChest = {
    id: uid(), goalId: s.goal.id, mode: "promise", amountMinor, currency, forfeitRule: rule, causeId,
    status: "active", forfeitedMinor: 0, fundedAt: iso(now), coolingOffUntil: null, settledAt: null, createdAt: iso(now),
  };
  const ev: WarChestEvent = { id: uid(), kind: "promise_made", amountMinor, createdAt: iso(now) };
  return {
    ...s,
    warChest: chest,
    warChestEvents: [ev],
    profile: { ...s.profile, warChestOfferedAt: s.profile.warChestOfferedAt ?? iso(now) },
  };
}

/** cancel_war_chest: promise any time; stake only inside the 24-hour cooling-off window. */
export function cancelWarChest(s: DeviceState, now: Date): { state: DeviceState; result: "cancelled" | "refund_pending" } {
  const w = s.warChest;
  if (!w || w.status !== "active" || !s.goal || s.goal.closedAt || w.goalId !== s.goal.id) throw new StoreError("no_active_chest");
  const ev: WarChestEvent = { id: uid(), kind: "cancelled", amountMinor: 0, createdAt: iso(now) };
  if (w.mode === "promise") {
    return { state: { ...s, warChest: { ...w, status: "cancelled" }, warChestEvents: [...s.warChestEvents, ev] }, result: "cancelled" };
  }
  if (!w.coolingOffUntil || now > new Date(w.coolingOffUntil)) throw new StoreError("locked_until_goal_end");
  return { state: { ...s, warChest: { ...w, status: "settling" }, warChestEvents: [...s.warChestEvents, ev] }, result: "refund_pending" };
}

/* ---------------- Camps (device mode: a local camp, optionally with labelled demo members) ---------------- */

const HANDLE_BLOCK = /(fuck|shit|cunt|nigg|fag|slut|whore|rape|porn|sex|nazi|bitch|dick|cock|pussy)/i;
export function cleanName(name: string): boolean {
  return !HANDLE_BLOCK.test(name.replace(/[^a-z]/gi, ""));
}

export function createCamp(s: DeviceState, name: string, seasonId: string | null, now: Date, withDemo = true): { state: DeviceState; id: string } {
  const n = name.trim();
  if (n.length < 2 || n.length > 40) throw new StoreError("bad_name");
  if (!cleanName(n)) throw new StoreError("name_not_allowed");
  const pro = isPro(s.entitlement, now);
  const owned = s.camps.filter((c) => c.ownerId === s.profile.id).length;
  if (!pro && owned >= 1) throw new StoreError("pro_required");
  const id = uid();
  const demoMembers: DemoMember[] = withDemo ? demoCampMembers(now, s.profile.timezone) : [];
  const camp = {
    id, name: n, ownerId: s.profile.id, seasonId, inviteCode: hex(10), maxMembers: pro ? PRO_CAMP_MAX : FREE_CAMP_MAX,
    createdAt: iso(now), demo: withDemo, members: [s.profile.id], demoMembers,
  };
  return { state: { ...s, camps: [...s.camps, camp] }, id };
}

export function demoCampMembers(now: Date, tz: string): DemoMember[] {
  const t = localDate(now, tz);
  const h = 3600_000;
  return [
    { id: "demo-rohan", handle: "rohan_k", avatarSeed: "a1b2c3", startedAt: iso(new Date(now.getTime() - 14 * 24 * h - 5 * h)), bestS: 0, daysKept: 14, lastCheckin: t },
    { id: "demo-dev", handle: "dev_s", avatarSeed: "d4e5f6", startedAt: iso(new Date(now.getTime() - 6 * 24 * h - 2 * h)), bestS: 9 * 86400, daysKept: 12, lastCheckin: addDays(t, -1) },
    { id: "demo-quiet", handle: "quietmile", avatarSeed: "778899", startedAt: iso(new Date(now.getTime() - 3 * 24 * h)), bestS: 11 * 86400, daysKept: 10, lastCheckin: addDays(t, -3) },
  ];
}

export function joinCamp(s: DeviceState, code: string): { state: DeviceState; id: string } {
  const camp = s.camps.find((c) => c.inviteCode === code.toLowerCase());
  if (!camp) throw new StoreError("invalid_code");
  if (camp.members.length + camp.demoMembers.length >= camp.maxMembers && !camp.members.includes(s.profile.id)) throw new StoreError("camp_full");
  return { state: s, id: camp.id };
}

export function leaveCamp(s: DeviceState, campId: string): DeviceState {
  return { ...s, camps: s.camps.filter((c) => c.id !== campId), challenges: s.challenges.filter((c) => c.campId !== campId) };
}

/** camp_leaderboard: handles and numbers only. */
export function campLeaderboard(s: DeviceState, campId: string, now: Date): BoardRow[] {
  const camp = s.camps.find((c) => c.id === campId);
  if (!camp) return [];
  const tz = s.profile.timezone;
  const win = camp.seasonId ? seasonWindow(SEASON.startsOn, SEASON.endsOn, tz) : undefined;
  const rows: BoardRow[] = [];
  if (s.profile.leaderboardVisibility !== "private") {
    const open = openStreak(s);
    const cur = open && new Date(open.startedAt) <= now ? Math.floor((now.getTime() - new Date(open.startedAt).getTime()) / 1000) : 0;
    const days = s.checkins.filter((c) => (c.status === "held" || c.status === "shielded") && (!camp.seasonId || (c.localDate >= SEASON.startsOn && c.localDate <= SEASON.endsOn))).length;
    const last = s.checkins.map((c) => c.localDate).sort().at(-1) ?? null;
    rows.push({
      memberId: s.profile.id, handle: s.profile.handle, avatarSeed: s.profile.avatarSeed, currentStreakS: cur,
      bestStreakS: Math.floor(bestStreakMs(s.streaks, now, win) / 1000), daysKept: days, lastCheckin: last,
      isBacked: s.profile.showBackedBadge && !!s.warChest && s.warChest.status === "active", isMe: true,
    });
  }
  for (const m of camp.demoMembers) {
    const cur = Math.floor((now.getTime() - new Date(m.startedAt).getTime()) / 1000);
    rows.push({ memberId: m.id, handle: m.handle, avatarSeed: m.avatarSeed, currentStreakS: cur, bestStreakS: Math.max(m.bestS, cur), daysKept: m.daysKept, lastCheckin: m.lastCheckin, isBacked: false, isMe: false });
  }
  return rows;
}

export function createChallenge(s: DeviceState, campId: string, kind: ChallengeKind, targetDays: number | null, startsAt: string, endsAt: string, now: Date): DeviceState {
  if (!isPro(s.entitlement, now)) throw new StoreError("pro_required");
  if (!s.camps.some((c) => c.id === campId)) throw new StoreError("not_member");
  if (new Date(endsAt) <= new Date(startsAt)) throw new StoreError("bad_dates");
  if (kind === "first_to_days" && (!targetDays || targetDays < 1 || targetDays > 365)) throw new StoreError("bad_target");
  return { ...s, challenges: [...s.challenges, { id: uid(), campId, kind, targetDays, startsAt, endsAt }] };
}

/** send_nudge: presets only, max 3 per sender per recipient per day. */
export function sendNudge(s: DeviceState, campId: string, to: string, key: NudgeKey, now: Date): DeviceState {
  if (!s.camps.some((c) => c.id === campId)) throw new StoreError("not_member");
  if (to === s.profile.id) throw new StoreError("self_nudge");
  const dayAgo = now.getTime() - 86400_000;
  if (s.nudges.filter((n) => n.to === to && new Date(n.at).getTime() > dayAgo).length >= 3) throw new StoreError("rate_limited");
  return { ...s, nudges: [...s.nudges, { campId, to, key, at: iso(now) }] };
}

export function logEvent(s: DeviceState, name: string, now: Date): DeviceState {
  if (!/^[a-z_]{3,40}$/.test(name)) return s;
  return { ...s, events: [...s.events.slice(-200), { name, at: iso(now) }] };
}
