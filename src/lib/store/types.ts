import type {
  CheckInResult,
  LocalDate,
  OnboardingInput,
  Preferences,
  PromiseChestInput,
  ResetResult,
  ResetTag,
  Snapshot,
  UrgeSessionInput,
} from "@/lib/domain/types";

export type LoadResult =
  | { status: "signed-out" }
  | { status: "needs-onboarding" }
  | { status: "ready"; snapshot: Snapshot };

export type AllowedEvent =
  | "crisis_card_shown"
  | "war_chest_offer_shown"
  | "install_prompt_shown"
  | "app_installed"
  | "pledge_skipped"
  | "paywall_shown";

/**
 * Everything a screen can do to the signed-in person's own data. Two implementations:
 * DeviceStore (IndexedDB, no account) and CloudStore (Supabase RPCs under RLS).
 * Methods throw `StoreError` with the same codes the database raises.
 */
export interface WillWarStore {
  readonly mode: "device" | "cloud";
  load(): Promise<LoadResult>;
  completeOnboarding(input: OnboardingInput): Promise<void>;
  checkHandleAvailable(handle: string): Promise<boolean>;
  signPledge(): Promise<void>;
  checkIn(): Promise<CheckInResult>;
  logReset(tags: ResetTag[]): Promise<ResetResult>;
  useShield(localDate: LocalDate): Promise<void>;
  /** Device mode grants locally (capped); cloud mode calls /api/rewards/shield. */
  grantRewardedShield(): Promise<void>;
  saveUrgeSession(input: UrgeSessionInput): Promise<void>;
  updatePreferences(p: Partial<Preferences>): Promise<void>;
  setTimezone(tz: string): Promise<void>;
  startGoal(input: { seasonId: string | null; endsOn: LocalDate | null }): Promise<void>;
  warChestOfferEligible(): Promise<boolean>;
  markWarChestOffered(): Promise<void>;
  createPromiseChest(input: PromiseChestInput): Promise<void>;
  cancelWarChest(): Promise<"cancelled" | "refund_pending">;
  logEvent(name: AllowedEvent): Promise<void>;
  /** Flush queued offline writes (cloud mode). Returns how many were sent. */
  sync(): Promise<number>;
  exportData(): Promise<Blob>;
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
}

export class StoreError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "StoreError";
  }
}

/** Plain-language messages for error codes (say what happened and how to fix it). */
export function errorMessage(e: unknown): string {
  const code = e instanceof StoreError ? e.code : e instanceof Error ? e.message : "unknown";
  const map: Record<string, string> = {
    must_be_18: "WillWar is for people 18 and over.",
    bad_timezone: "We couldn't read your timezone. Pick one in Settings.",
    season_over: "That season has ended. Pick 30 days from today instead.",
    bad_end_date: "Pick an end date between tomorrow and a year from now.",
    start_out_of_range: "You can start up to 48 hours back, or from the season start.",
    handle_taken: "That handle is taken. Try another.",
    bad_handle: "Use 3–20 letters, numbers or underscores.",
    no_open_streak: "Your clock hasn't started yet.",
    shield_window: "Shields cover a missed day in the last three days.",
    already_recorded: "That day already has a check-in.",
    not_in_streak: "That day is before your current streak.",
    no_shield: "You don't have a shield right now.",
    shield_cap: "You've earned two shields this week. Try again in a few days.",
    goal_open: "You already have a challenge running.",
    no_open_goal: "Start a challenge first.",
    bad_cause: "Pick one of the listed causes.",
    no_active_chest: "There's no active War Chest.",
    locked_until_goal_end: "The 24-hour cancel window has passed. Contact support if you need it back.",
    timezone_rate_limited: "You can change your timezone once a week.",
    offline: "Offline. Your clock keeps running; check-ins sync when you're back.",
    cloud_disabled: "This needs an account, which isn't available on this build.",
    not_authenticated: "Sign in to continue.",
    pro_required: "This is part of Pro.",
    refund_first: "We're returning your War Chest first. Try again in a few minutes.",
    chest_exists: "You already have a War Chest for this challenge.",
    bad_amount: "Pick an amount inside the limits shown.",
  };
  return map[code] ?? "Something went wrong. Try again.";
}
