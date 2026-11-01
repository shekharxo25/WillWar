import type {
  Currency,
  ForfeitRule,
  Game,
  LeaderboardVisibility,
  ResetTag,
  Tone,
  WarChestEventKind,
  WhyTag,
} from "./constants";

/** A calendar date in the profile's timezone, "YYYY-MM-DD". */
export type LocalDate = string;
/** An ISO-8601 instant. */
export type Instant = string;

export interface Profile {
  id: string;
  handle: string;
  avatarSeed: string;
  timezone: string;
  tone: Tone;
  whyTags: WhyTag[];
  discreetNotifications: boolean;
  leaderboardVisibility: LeaderboardVisibility;
  showBackedBadge: boolean;
  warChestOfferedAt: Instant | null;
  /** "HH:MM" in the profile timezone. */
  reminderTime: string;
  nightWatch: boolean;
  adultConfirmedAt: Instant;
  createdAt: Instant;
}

export interface Streak {
  id: string;
  startedAt: Instant;
  endedAt: Instant | null;
}

export type CheckinStatus = "held" | "reset" | "shielded";

export interface Checkin {
  localDate: LocalDate;
  status: CheckinStatus;
}

export interface Goal {
  id: string;
  seasonId: string | null;
  endsOn: LocalDate;
  pledgeSignedAt: Instant | null;
  createdAt: Instant;
  closedAt: Instant | null;
}

export interface Shield {
  id: string;
  source: "rewarded_ad" | "pro_monthly" | "referral";
  grantedAt: Instant;
  usedOn: LocalDate | null;
}

export interface UrgeSession {
  id: string;
  startedAt: Instant;
  game: Game;
  durationS: number;
  intensityBefore: number | null;
  intensityAfter: number | null;
  completed: boolean;
}

export type WarChestStatus = "pending" | "active" | "settling" | "settled" | "cancelled";

export interface WarChest {
  id: string;
  goalId: string;
  mode: "promise" | "stake";
  amountMinor: number;
  currency: Currency;
  forfeitRule: ForfeitRule;
  causeId: string;
  status: WarChestStatus;
  forfeitedMinor: number;
  fundedAt: Instant | null;
  coolingOffUntil: Instant | null;
  settledAt: Instant | null;
  createdAt: Instant;
}

export interface WarChestEvent {
  id: string;
  kind: WarChestEventKind;
  amountMinor: number;
  createdAt: Instant;
}

export interface Entitlement {
  plan: "season" | "annual";
  status: "active" | "past_due" | "canceled" | "expired";
  currentPeriodEnd: Instant | null;
}

/** Everything the signed-in person can see about themselves. */
export interface Snapshot {
  mode: "device" | "cloud";
  email: string | null;
  profile: Profile;
  openStreak: Streak | null;
  /** Newest first. Includes the open streak. */
  streaks: Streak[];
  /** Newest first, at most the last 120 days. */
  checkins: Checkin[];
  goal: Goal | null;
  shields: Shield[];
  /** The War Chest attached to the open goal, if any (any status). */
  warChest: WarChest | null;
  warChestEvents: WarChestEvent[];
  /** Newest first, at most 200. */
  urgeSessions: UrgeSession[];
  /** Own resets (tags only, never free text), newest first. Visible to nobody else. */
  resets: { occurredAt: Instant; tags: ResetTag[] }[];
  entitlement: Entitlement | null;
}

export interface OnboardingInput {
  handle: string;
  birthDate: LocalDate; // sent once, never stored
  timezone: string;
  tone: Tone;
  whyTags: WhyTag[];
  seasonId: string | null;
  endsOn: LocalDate | null; // when seasonId is null
  startedAt: Instant;
  /** 12 hex chars chosen with Shuffle; random when omitted. */
  avatarSeed?: string;
}

export interface Preferences {
  tone: Tone;
  whyTags: WhyTag[];
  discreetNotifications: boolean;
  leaderboardVisibility: LeaderboardVisibility;
  showBackedBadge: boolean;
  reminderTime: string;
  nightWatch: boolean;
}

export interface CheckInResult {
  status: "held";
  localDate: LocalDate;
  /** True when saved offline and waiting to sync. */
  queued: boolean;
}

export interface ResetResult {
  /** Amount moved to the cause by this reset (0 without an active War Chest). */
  forfeitMinor: number;
}

export interface UrgeSessionInput {
  game: Game;
  durationS: number;
  intensityBefore: number | null;
  intensityAfter: number | null;
  completed: boolean;
}

export interface PromiseChestInput {
  amountMinor: number;
  currency: Currency;
  forfeitRule: ForfeitRule;
  causeId: string;
}

export type { ResetTag };
