// Device mode: the same rules as the database RPCs, applied to a local state object.
// Pure apart from the injected clock and id generator, so it is unit tested directly.
import { CAUSES, CHEST_LIMITS, CURRENT_SEASON, RESET_TAGS, type ResetTag, TONES } from "@/lib/domain/constants";
import {
  forfeitFor,
  handleError,
  isAdult,
  normaliseHandle,
  resolveGoalEnd,
  RuleError,
  seasonStartInstant,
  shieldError,
  startWindow,
  validChestAmount,
  validateWhyTags,
  warChestOfferEligible,
} from "@/lib/domain/rules";
import type {
  Checkin,
  Goal,
  OnboardingInput,
  Preferences,
  Profile,
  PromiseChestInput,
  Shield,
  Snapshot,
  Streak,
  UrgeSession,
  UrgeSessionInput,
  WarChest,
  WarChestEvent,
} from "@/lib/domain/types";
import { isValidTimeZone, localDate, MS_DAY } from "@/lib/time";

export interface DeviceState {
  version: 1;
  profile: Profile | null;
  streaks: Streak[];
  checkins: Checkin[];
  resets: { id: string; occurredAt: string; tags: ResetTag[] }[];
  goals: Goal[];
  shields: Shield[];
  urgeSessions: UrgeSession[];
  warChests: WarChest[];
  warChestEvents: (WarChestEvent & { warChestId: string })[];
  events: { name: string; createdAt: string }[];
  timezoneChangedAt: string | null;
}

export const emptyState = (): DeviceState => ({
  version: 1,
  profile: null,
  streaks: [],
  checkins: [],
  resets: [],
  goals: [],
  shields: [],
  urgeSessions: [],
  warChests: [],
  warChestEvents: [],
  events: [],
  timezoneChangedAt: null,
});

export interface Clock {
  now(): Date;
  id(): string;
}

const fail = (code: string): never => {
  throw new RuleError(code);
};

export class DeviceEngine {
  constructor(
    public state: DeviceState,
    private readonly clock: Clock,
  ) {}

  private get profile(): Profile {
    return this.state.profile ?? fail("no_profile");
  }

  private today() {
    return localDate(this.clock.now(), this.profile.timezone);
  }

  private openStreak(): Streak | null {
    return this.state.streaks.find((s) => s.endedAt === null) ?? null;
  }

  private openGoal(): Goal | null {
    return this.state.goals.find((g) => g.closedAt === null) ?? null;
  }

  private chestForGoal(goalId: string): WarChest | null {
    return this.state.warChests.find((w) => w.goalId === goalId) ?? null;
  }

  private chestEvent(warChestId: string, kind: WarChestEvent["kind"], amountMinor = 0) {
    this.state.warChestEvents.push({
      id: this.clock.id(),
      warChestId,
      kind,
      amountMinor,
      createdAt: this.clock.now().toISOString(),
    });
  }

  completeOnboarding(input: OnboardingInput): void {
    if (this.state.profile) fail("already_onboarded");
    const now = this.clock.now();
    if (!isValidTimeZone(input.timezone)) fail("bad_timezone");
    // The age check uses the device's own calendar day; the birth date is then discarded.
    if (!input.birthDate || !isAdult(input.birthDate, localDate(now, input.timezone))) fail("must_be_18");
    if (handleError(input.handle)) fail("bad_handle");
    if (!TONES.includes(input.tone)) fail("bad_tone");
    const whyTags = validateWhyTags(input.whyTags);
    const today = localDate(now, input.timezone);
    const season = input.seasonId === CURRENT_SEASON.id ? CURRENT_SEASON : null;
    const endsOn = resolveGoalEnd({ seasonId: input.seasonId, endsOn: input.endsOn }, season, today);
    const seasonStart = season ? seasonStartInstant(season, input.timezone) : null;
    const window = startWindow(now, seasonStart);
    const startedAt = new Date(input.startedAt);
    if (Number.isNaN(startedAt.getTime()) || startedAt > window.max || startedAt < window.min) {
      fail("start_out_of_range");
    }
    const id = this.clock.id();
    this.state.profile = {
      id,
      handle: normaliseHandle(input.handle),
      avatarSeed:
        input.avatarSeed && /^[0-9a-f]{12}$/.test(input.avatarSeed)
          ? input.avatarSeed
          : this.clock.id().replace(/-/g, "").slice(0, 12),
      timezone: input.timezone,
      tone: input.tone,
      whyTags,
      discreetNotifications: true,
      leaderboardVisibility: "pacts",
      showBackedBadge: false,
      warChestOfferedAt: null,
      reminderTime: "21:30",
      nightWatch: false,
      adultConfirmedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };
    this.state.streaks.push({ id: this.clock.id(), startedAt: startedAt.toISOString(), endedAt: null });
    this.state.goals.push({
      id: this.clock.id(),
      seasonId: season?.id ?? null,
      endsOn,
      pledgeSignedAt: null,
      createdAt: now.toISOString(),
      closedAt: null,
    });
  }

  signPledge(): void {
    const goal = this.openGoal();
    if (goal && !goal.pledgeSignedAt) goal.pledgeSignedAt = this.clock.now().toISOString();
  }

  checkIn(): Checkin {
    const now = this.clock.now();
    const today = this.today();
    const open = this.openStreak();
    if (!open || new Date(open.startedAt) > now) fail("no_open_streak");
    const existing = this.state.checkins.find((c) => c.localDate === today);
    if (existing) return existing;
    const c: Checkin = { localDate: today, status: "held" };
    this.state.checkins.push(c);
    return c;
  }

  logReset(tags: ResetTag[]): number {
    const now = this.clock.now().toISOString();
    const today = this.today();
    const clean = Array.from(new Set(tags)).filter((t) => RESET_TAGS.includes(t));
    for (const s of this.state.streaks) if (s.endedAt === null) s.endedAt = now;
    this.state.resets.push({ id: this.clock.id(), occurredAt: now, tags: clean });
    const existing = this.state.checkins.find((c) => c.localDate === today);
    if (existing) existing.status = "reset";
    else this.state.checkins.push({ localDate: today, status: "reset" });
    this.state.streaks.push({ id: this.clock.id(), startedAt: now, endedAt: null });

    const goal = this.openGoal();
    const chest = goal ? this.chestForGoal(goal.id) : null;
    if (!chest || chest.status !== "active") return 0;
    const forfeit = forfeitFor(chest);
    if (forfeit > 0) {
      chest.forfeitedMinor += forfeit;
      this.chestEvent(chest.id, chest.mode === "stake" ? "forfeit" : "promise_forfeit", forfeit);
    }
    return forfeit;
  }

  useShield(target: string): void {
    const err = shieldError(target, this.today(), this.openStreak(), this.state.checkins, this.profile.timezone);
    if (err) fail(err);
    const shield = [...this.state.shields]
      .filter((s) => !s.usedOn)
      .sort((a, b) => a.grantedAt.localeCompare(b.grantedAt))[0];
    if (!shield) fail("no_shield");
    shield.usedOn = target;
    this.state.checkins.push({ localDate: target, status: "shielded" });
  }

  grantRewardedShield(): void {
    const now = this.clock.now().getTime();
    const recent = this.state.shields.filter(
      (s) => s.source === "rewarded_ad" && now - new Date(s.grantedAt).getTime() < 7 * MS_DAY,
    );
    if (recent.length >= 2) fail("shield_cap");
    this.state.shields.push({
      id: this.clock.id(),
      source: "rewarded_ad",
      grantedAt: new Date(now).toISOString(),
      usedOn: null,
    });
  }

  saveUrgeSession(input: UrgeSessionInput): void {
    if (input.durationS < 0 || input.durationS > 1800) fail("bad_duration");
    for (const v of [input.intensityBefore, input.intensityAfter]) {
      if (v !== null && (v < 1 || v > 10 || !Number.isInteger(v))) fail("bad_intensity");
    }
    this.state.urgeSessions.push({ id: this.clock.id(), startedAt: this.clock.now().toISOString(), ...input });
  }

  updatePreferences(p: Partial<Preferences>): void {
    const profile = this.profile;
    if (p.whyTags) p = { ...p, whyTags: validateWhyTags(p.whyTags) };
    Object.assign(profile, p);
  }

  setTimezone(tz: string): void {
    if (!isValidTimeZone(tz)) fail("bad_timezone");
    const now = this.clock.now();
    if (this.state.timezoneChangedAt && now.getTime() - new Date(this.state.timezoneChangedAt).getTime() < 7 * MS_DAY) {
      fail("timezone_rate_limited");
    }
    this.profile.timezone = tz;
    this.state.timezoneChangedAt = now.toISOString();
    this.state.events.push({ name: "timezone_changed", createdAt: now.toISOString() });
  }

  startGoal(input: { seasonId: string | null; endsOn: string | null }): void {
    if (this.openGoal()) fail("goal_open");
    const season = input.seasonId === CURRENT_SEASON.id ? CURRENT_SEASON : null;
    const endsOn = resolveGoalEnd(input, season, this.today());
    this.state.goals.push({
      id: this.clock.id(),
      seasonId: season?.id ?? null,
      endsOn,
      pledgeSignedAt: null,
      createdAt: this.clock.now().toISOString(),
      closedAt: null,
    });
  }

  warChestOfferEligible(): boolean {
    const goal = this.openGoal();
    const crisis = this.state.events
      .filter((e) => e.name === "crisis_card_shown")
      .map((e) => new Date(e.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return warChestOfferEligible({
      now: this.clock.now(),
      timezone: this.profile.timezone,
      warChestOfferedAt: this.profile.warChestOfferedAt,
      goal,
      hasHeldCheckin: this.state.checkins.some((c) => c.status === "held"),
      hasChestForGoal: goal ? Boolean(this.chestForGoal(goal.id)) : false,
      lastCrisisCardAt: crisis ?? null,
    });
  }

  markWarChestOffered(): void {
    if (!this.profile.warChestOfferedAt) this.profile.warChestOfferedAt = this.clock.now().toISOString();
  }

  createPromiseChest(input: PromiseChestInput): void {
    const goal = this.openGoal() ?? fail("no_open_goal");
    if (!CAUSES.some((c) => c.id === input.causeId)) fail("bad_cause");
    if (!(input.currency in CHEST_LIMITS) || !validChestAmount(input.amountMinor, input.currency)) fail("bad_amount");
    if (this.chestForGoal(goal.id)) fail("chest_exists");
    const now = this.clock.now().toISOString();
    const chest: WarChest = {
      id: this.clock.id(),
      goalId: goal.id,
      mode: "promise",
      amountMinor: input.amountMinor,
      currency: input.currency,
      forfeitRule: input.forfeitRule,
      causeId: input.causeId,
      status: "active",
      forfeitedMinor: 0,
      fundedAt: now,
      coolingOffUntil: null,
      settledAt: null,
      createdAt: now,
    };
    this.state.warChests.push(chest);
    this.chestEvent(chest.id, "promise_made", input.amountMinor);
    this.markWarChestOffered();
  }

  cancelWarChest(): "cancelled" {
    const goal = this.openGoal();
    const chest = goal ? this.chestForGoal(goal.id) : null;
    if (!chest || chest.status !== "active") fail("no_active_chest");
    chest!.status = "cancelled";
    this.chestEvent(chest!.id, "cancelled");
    return "cancelled";
  }

  logEvent(name: string): void {
    this.state.events.push({ name, createdAt: this.clock.now().toISOString() });
  }

  /** Mirrors settle_due_war_chests() for device mode: close finished goals, settle promises. */
  settleDue(): void {
    if (!this.state.profile) return;
    const today = this.today();
    for (const g of this.state.goals) {
      if (g.closedAt === null && g.endsOn < today) {
        g.closedAt = this.clock.now().toISOString();
        const chest = this.chestForGoal(g.id);
        if (chest && chest.status === "active") {
          chest.status = "settled";
          chest.settledAt = this.clock.now().toISOString();
          this.chestEvent(chest.id, "settled");
        }
      }
    }
  }

  snapshot(): Snapshot | null {
    const s = this.state;
    if (!s.profile) return null;
    // Newest first; equal timestamps keep reverse insertion order (stable sort).
    const desc = <T>(arr: T[], key: (x: T) => string) =>
      [...arr].reverse().sort((a, b) => key(b).localeCompare(key(a)));
    const goal = this.openGoal();
    const chest = goal ? this.chestForGoal(goal.id) : null;
    return {
      mode: "device",
      email: null,
      profile: { ...s.profile },
      openStreak: this.openStreak(),
      streaks: desc(s.streaks, (x) => x.startedAt),
      checkins: desc(s.checkins, (x) => x.localDate).slice(0, 120),
      goal,
      shields: [...s.shields],
      warChest: chest,
      warChestEvents: chest
        ? desc(
            s.warChestEvents.filter((e) => e.warChestId === chest.id),
            (x) => x.createdAt,
          ).map(({ warChestId: _omit, ...e }) => {
            void _omit;
            return e;
          })
        : [],
      urgeSessions: desc(s.urgeSessions, (x) => x.startedAt).slice(0, 200),
      resets: desc(s.resets, (x) => x.occurredAt).map(({ occurredAt, tags }) => ({ occurredAt, tags })),
      entitlement: null,
    };
  }
}
