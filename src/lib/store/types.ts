export type Tone = "steady" | "stoic" | "coach" | "playful";
export type CheckinStatus = "held" | "reset" | "shielded";
export type Visibility = "private" | "camps" | "global";
export type Game = "kitbag" | "bag" | "combos";
export type ResetTag = "late_night" | "bored" | "stressed" | "alone" | "scrolling" | "drinking" | "other";
export type NudgeKey = "proud_of_you" | "go_a_round" | "get_up" | "almost_there" | "in_your_corner";
export type ChallengeKind = "first_to_days" | "longest_streak" | "most_days";

export const RESET_TAGS: { key: ResetTag; label: string }[] = [
  { key: "late_night", label: "Late night" },
  { key: "bored", label: "Bored" },
  { key: "stressed", label: "Stressed" },
  { key: "alone", label: "Alone" },
  { key: "scrolling", label: "Scrolling" },
  { key: "drinking", label: "Drinking" },
  { key: "other", label: "Something else" },
];

export const NUDGES: { key: NudgeKey; label: string }[] = [
  { key: "proud_of_you", label: "Proud of you" },
  { key: "go_a_round", label: "Go a round. You've got this." },
  { key: "get_up", label: "Get up. Day one counts." },
  { key: "almost_there", label: "Almost there" },
  { key: "in_your_corner", label: "I'm in your corner" },
];

export const WHY_TAGS = [
  { key: "focus", label: "Focus" },
  { key: "discipline", label: "Discipline" },
  { key: "sleep", label: "Better sleep" },
  { key: "less_scrolling", label: "Less scrolling" },
  { key: "faith", label: "Faith or values" },
  { key: "prove_it", label: "Prove it to myself" },
  { key: "friends", label: "My friends challenged me" },
  { key: "other", label: "Something else" },
] as const;

export type Profile = {
  id: string;
  handle: string;
  avatarSeed: string;
  timezone: string;
  tone: Tone;
  whyTags: string[];
  discreetNotifications: boolean;
  leaderboardVisibility: Visibility;
  showBackedBadge: boolean;
  warChestOfferedAt: string | null;
  createdAt: string;
  country: "IN" | "US" | "GB" | null;
};

export type Streak = { id: string; startedAt: string; endedAt: string | null };
export type Checkin = { localDate: string; status: CheckinStatus; createdAt: string };
export type Reset = { id: string; occurredAt: string; tags: ResetTag[] };
export type UrgeSession = {
  id: string;
  startedAt: string;
  game: Game;
  durationS: number;
  intensityBefore: number | null;
  intensityAfter: number | null;
  completed: boolean;
};
export type Goal = {
  id: string;
  seasonId: string | null;
  startDate: string; // local date the challenge window starts (derived; not a DB column)
  endsOn: string;
  pledgeSignedAt: string | null;
  createdAt: string;
  closedAt: string | null;
};
export type Shield = { id: string; source: "rewarded_ad" | "pro_monthly" | "referral"; grantedAt: string; usedOn: string | null };
export type Entitlement = { plan: "season" | "annual"; status: "active" | "past_due" | "canceled" | "expired"; currentPeriodEnd: string | null };

export type WarChestStatus = "pending" | "active" | "settling" | "settled" | "cancelled";
export type WarChest = {
  id: string;
  goalId: string;
  mode: "promise" | "stake";
  amountMinor: number;
  currency: "INR" | "USD";
  forfeitRule: "steady" | "strict";
  causeId: string;
  status: WarChestStatus;
  forfeitedMinor: number;
  fundedAt: string | null;
  coolingOffUntil: string | null;
  settledAt: string | null;
  createdAt: string;
};
export type WarChestEvent = {
  id: string;
  kind: "promise_made" | "funded" | "forfeit" | "promise_forfeit" | "cancelled" | "refund_issued" | "settled";
  amountMinor: number;
  createdAt: string;
};

export type Camp = { id: string; name: string; ownerId: string; seasonId: string | null; inviteCode: string; maxMembers: number; createdAt: string; demo?: boolean };
export type Challenge = { id: string; campId: string; kind: ChallengeKind; targetDays: number | null; startsAt: string; endsAt: string };
export type BoardRow = {
  memberId: string;
  handle: string;
  avatarSeed: string;
  currentStreakS: number;
  bestStreakS: number;
  daysKept: number;
  lastCheckin: string | null;
  isBacked: boolean;
  isMe: boolean;
};

export type Snapshot = {
  profile: Profile;
  streaks: Streak[];
  checkins: Checkin[];
  resets: Reset[];
  urgeSessions: UrgeSession[];
  goal: Goal | null;
  shields: Shield[];
  entitlement: Entitlement | null;
  warChest: WarChest | null;
  warChestEvents: WarChestEvent[];
};

export type OnboardingInput = {
  handle: string;
  birthDate: string; // checked once, never stored
  timezone: string;
  tone: Tone;
  why: string[];
  seasonId: string | null;
  endsOn: string | null;
  startedAt: string;
  pledgeSigned: boolean;
  country?: "IN" | "US" | "GB" | null;
};

export type Preferences = Partial<Pick<Profile, "tone" | "whyTags" | "discreetNotifications" | "leaderboardVisibility" | "showBackedBadge">>;

export class StoreError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export interface Store {
  readonly mode: "device" | "cloud";
  load(): Promise<Snapshot | null>;
  handleAvailable(handle: string): Promise<boolean>;
  completeOnboarding(input: OnboardingInput): Promise<void>;
  signPledge(): Promise<void>;
  checkIn(): Promise<"held">;
  logReset(tags: ResetTag[]): Promise<number>;
  spendShield(localDate: string): Promise<void>;
  saveUrgeSession(s: Omit<UrgeSession, "id">): Promise<void>;
  updatePreferences(p: Preferences): Promise<void>;
  startGoal(endsOn: string | null, seasonId: string | null): Promise<void>;
  changeEndDate(endsOn: string): Promise<void>;
  warChestOfferEligible(): Promise<boolean>;
  markWarChestOffered(): Promise<void>;
  createPromiseChest(amountMinor: number, currency: "INR" | "USD", rule: "steady" | "strict", causeId: string): Promise<void>;
  cancelWarChest(): Promise<"cancelled" | "refund_pending">;
  listCamps(): Promise<Camp[]>;
  createCamp(name: string, seasonId: string | null): Promise<string>;
  joinCamp(code: string): Promise<string>;
  leaveCamp(campId: string): Promise<void>;
  campLeaderboard(campId: string): Promise<BoardRow[]>;
  listChallenges(campId: string): Promise<Challenge[]>;
  createChallenge(campId: string, kind: ChallengeKind, targetDays: number | null, startsAt: string, endsAt: string): Promise<void>;
  sendNudge(campId: string, to: string, key: NudgeKey): Promise<void>;
  grantShield(source: Shield["source"]): Promise<void>;
  exportData(): Promise<unknown>;
  deleteAccount(): Promise<void>;
  /** Dev and device mode only: simulate the verified webhook granting Pro. */
  devSetEntitlement?(plan: "season" | "annual" | null): Promise<void>;
}
