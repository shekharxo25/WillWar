"use client";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Checkin,
  Entitlement,
  Goal,
  Profile,
  Shield,
  Snapshot,
  Streak,
  UrgeSession,
  UrgeSessionInput,
  WarChest,
  WarChestEvent,
} from "@/lib/domain/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { localDate } from "@/lib/time";
import { kvDelete, kvGet, kvSet } from "./kv";
import { StoreError, type AllowedEvent, type LoadResult, type WillWarStore } from "./types";

type Row = Record<string, unknown>;
type QueueItem =
  | { kind: "checkin"; queuedAt: string }
  | { kind: "urge"; queuedAt: string; input: UrgeSessionInput; startedAt: string };

const QUEUE_KEY = "cloud-queue";
const SNAPSHOT_KEY = "cloud-snapshot";

const KNOWN_CODES = [
  "must_be_18",
  "bad_timezone",
  "bad_season",
  "season_over",
  "bad_end_date",
  "start_out_of_range",
  "no_profile",
  "no_open_streak",
  "shield_window",
  "already_recorded",
  "not_in_streak",
  "no_shield",
  "goal_open",
  "no_open_goal",
  "bad_cause",
  "no_active_chest",
  "locked_until_goal_end",
  "timezone_rate_limited",
  "pro_required",
  "not_authenticated",
  "bad_handle",
];

function toStoreError(e: PostgrestError | Error | null): StoreError {
  if (!e) return new StoreError("unknown");
  if ("code" in e && e.code === "23505") return new StoreError("handle_taken");
  const msg = e.message ?? "";
  const code = KNOWN_CODES.find((c) => msg.includes(c));
  if (code) return new StoreError(code);
  if (/fetch|network|Failed to fetch/i.test(msg)) return new StoreError("offline");
  return new StoreError("unknown", msg);
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

// Row mappers (snake_case → domain types). Only columns the owner may read are selected.
const mapProfile = (r: Row): Profile => ({
  id: r.id as string,
  handle: r.handle as string,
  avatarSeed: r.avatar_seed as string,
  timezone: r.timezone as string,
  tone: r.tone as Profile["tone"],
  whyTags: (r.why_tags as Profile["whyTags"]) ?? [],
  discreetNotifications: r.discreet_notifications as boolean,
  leaderboardVisibility: r.leaderboard_visibility as Profile["leaderboardVisibility"],
  showBackedBadge: r.show_backed_badge as boolean,
  warChestOfferedAt: (r.war_chest_offered_at as string | null) ?? null,
  reminderTime: (r.reminder_time as string | undefined) ?? "21:30",
  nightWatch: Boolean(r.night_watch),
  adultConfirmedAt: r.adult_confirmed_at as string,
  createdAt: r.created_at as string,
});
const mapStreak = (r: Row): Streak => ({
  id: r.id as string,
  startedAt: r.started_at as string,
  endedAt: (r.ended_at as string | null) ?? null,
});
const mapCheckin = (r: Row): Checkin => ({ localDate: r.local_date as string, status: r.status as Checkin["status"] });
const mapGoal = (r: Row): Goal => ({
  id: r.id as string,
  seasonId: (r.season_id as string | null) ?? null,
  endsOn: r.ends_on as string,
  pledgeSignedAt: (r.pledge_signed_at as string | null) ?? null,
  createdAt: r.created_at as string,
  closedAt: (r.closed_at as string | null) ?? null,
});
const mapShield = (r: Row): Shield => ({
  id: r.id as string,
  source: r.source as Shield["source"],
  grantedAt: r.granted_at as string,
  usedOn: (r.used_on as string | null) ?? null,
});
const mapUrge = (r: Row): UrgeSession => ({
  id: r.id as string,
  startedAt: r.started_at as string,
  game: r.game as UrgeSession["game"],
  durationS: r.duration_s as number,
  intensityBefore: (r.intensity_before as number | null) ?? null,
  intensityAfter: (r.intensity_after as number | null) ?? null,
  completed: r.completed as boolean,
});
const mapChest = (r: Row): WarChest => ({
  id: r.id as string,
  goalId: r.goal_id as string,
  mode: r.mode as WarChest["mode"],
  amountMinor: r.amount_minor as number,
  currency: r.currency as WarChest["currency"],
  forfeitRule: r.forfeit_rule as WarChest["forfeitRule"],
  causeId: r.cause_id as string,
  status: r.status as WarChest["status"],
  forfeitedMinor: r.forfeited_minor as number,
  fundedAt: (r.funded_at as string | null) ?? null,
  coolingOffUntil: (r.cooling_off_until as string | null) ?? null,
  settledAt: (r.settled_at as string | null) ?? null,
  createdAt: r.created_at as string,
});
const mapChestEvent = (r: Row): WarChestEvent => ({
  id: r.id as string,
  kind: r.kind as WarChestEvent["kind"],
  amountMinor: r.amount_minor as number,
  createdAt: r.created_at as string,
});
const mapEntitlement = (r: Row): Entitlement => ({
  plan: r.plan as Entitlement["plan"],
  status: r.status as Entitlement["status"],
  currentPeriodEnd: (r.current_period_end as string | null) ?? null,
});

/** Cloud mode: Supabase with the publishable key; RLS limits every query to the caller. */
export class CloudStore implements WillWarStore {
  readonly mode = "cloud" as const;
  private get sb(): SupabaseClient {
    return getBrowserSupabase();
  }

  private async rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
    if (isOffline()) throw new StoreError("offline");
    const { data, error } = await this.sb.rpc(name, args ?? {});
    if (error) throw toStoreError(error);
    return data as T;
  }

  private async userId(): Promise<string> {
    const { data } = await this.sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new StoreError("not_authenticated");
    return id;
  }

  async load(): Promise<LoadResult> {
    const { data: sessionData } = await this.sb.auth.getSession();
    const session = sessionData.session;
    if (!session) return { status: "signed-out" };
    const uid = session.user.id;

    if (isOffline()) {
      const cached = await kvGet<Snapshot>(SNAPSHOT_KEY);
      return cached && cached.profile.id === uid ? { status: "ready", snapshot: cached } : { status: "signed-out" };
    }

    try {
      await this.sync();
      const sb = this.sb;
      const { data: profileRow, error: pErr } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (pErr) throw pErr;
      if (!profileRow) return { status: "needs-onboarding" };

      const [streaks, checkins, goals, shields, urges, entitlement, resets] = await Promise.all([
        sb.from("streaks").select("id,started_at,ended_at").order("started_at", { ascending: false }).limit(60),
        sb.from("checkins").select("local_date,status").order("local_date", { ascending: false }).limit(120),
        sb.from("goals").select("*").is("closed_at", null).limit(1),
        sb.from("shields").select("*").order("granted_at", { ascending: true }),
        sb.from("urge_sessions").select("*").order("started_at", { ascending: false }).limit(200),
        sb.from("entitlements").select("plan,status,current_period_end").maybeSingle(),
        sb.from("resets").select("occurred_at,tags").order("occurred_at", { ascending: false }).limit(200),
      ]);
      for (const r of [streaks, checkins, goals, shields, urges, entitlement, resets]) if (r.error) throw r.error;

      const goal = goals.data?.[0] ? mapGoal(goals.data[0]) : null;
      let warChest: WarChest | null = null;
      let warChestEvents: WarChestEvent[] = [];
      if (goal) {
        const chest = await sb.from("war_chests").select("*").eq("goal_id", goal.id).maybeSingle();
        if (chest.error) throw chest.error;
        if (chest.data) {
          warChest = mapChest(chest.data);
          const ev = await sb
            .from("war_chest_events")
            .select("*")
            .eq("war_chest_id", warChest.id)
            .order("created_at", { ascending: false });
          if (ev.error) throw ev.error;
          warChestEvents = (ev.data ?? []).map(mapChestEvent);
        }
      }
      const streakList = (streaks.data ?? []).map(mapStreak);
      const snapshot: Snapshot = {
        mode: "cloud",
        email: session.user.email ?? null,
        profile: mapProfile(profileRow),
        openStreak: streakList.find((s) => s.endedAt === null) ?? null,
        streaks: streakList,
        checkins: (checkins.data ?? []).map(mapCheckin),
        goal,
        shields: (shields.data ?? []).map(mapShield),
        warChest,
        warChestEvents,
        urgeSessions: (urges.data ?? []).map(mapUrge),
        resets: (resets.data ?? []).map((r: Row) => ({ occurredAt: r.occurred_at as string, tags: (r.tags as Snapshot["resets"][number]["tags"]) ?? [] })),
        entitlement: entitlement.data ? mapEntitlement(entitlement.data) : null,
      };
      await kvSet(SNAPSHOT_KEY, snapshot);
      return { status: "ready", snapshot };
    } catch (e) {
      const cached = await kvGet<Snapshot>(SNAPSHOT_KEY);
      if (cached && cached.profile.id === uid) return { status: "ready", snapshot: cached };
      throw toStoreError(e as Error);
    }
  }

  async checkHandleAvailable(handle: string): Promise<boolean> {
    return this.rpc<boolean>("check_handle_available", { p_handle: handle });
  }

  async completeOnboarding(input: Parameters<WillWarStore["completeOnboarding"]>[0]): Promise<void> {
    await this.rpc("complete_onboarding", {
      p_handle: input.handle,
      p_birth_date: input.birthDate,
      p_timezone: input.timezone,
      p_tone: input.tone,
      p_why: input.whyTags,
      p_season: input.seasonId,
      p_ends_on: input.endsOn,
      p_started_at: input.startedAt,
      p_avatar_seed: input.avatarSeed ?? null,
    });
  }

  async signPledge() {
    await this.rpc("sign_pledge");
  }

  private async enqueue(item: QueueItem) {
    const q = (await kvGet<QueueItem[]>(QUEUE_KEY)) ?? [];
    q.push(item);
    await kvSet(QUEUE_KEY, q);
  }

  async checkIn() {
    if (isOffline()) {
      await this.enqueue({ kind: "checkin", queuedAt: new Date().toISOString() });
      const cached = await kvGet<Snapshot>(SNAPSHOT_KEY);
      const tz = cached?.profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      return { status: "held" as const, localDate: localDate(new Date(), tz), queued: true };
    }
    await this.rpc<string>("check_in");
    const cached = await kvGet<Snapshot>(SNAPSHOT_KEY);
    const tz = cached?.profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    return { status: "held" as const, localDate: localDate(new Date(), tz), queued: false };
  }

  async logReset(tags: Parameters<WillWarStore["logReset"]>[0]) {
    const forfeit = await this.rpc<number>("log_reset", { p_tags: tags });
    return { forfeitMinor: forfeit ?? 0 };
  }

  async useShield(d: string) {
    await this.rpc("use_shield", { p_local_date: d });
  }

  async grantRewardedShield() {
    const res = await fetch("/api/rewards/shield", { method: "POST" });
    if (res.status === 429) throw new StoreError("shield_cap");
    if (!res.ok) throw new StoreError("unknown");
  }

  async saveUrgeSession(input: UrgeSessionInput) {
    const startedAt = new Date(Date.now() - input.durationS * 1000).toISOString();
    if (isOffline()) {
      await this.enqueue({ kind: "urge", queuedAt: new Date().toISOString(), input, startedAt });
      return;
    }
    await this.insertUrge(input, startedAt);
  }

  private async insertUrge(input: UrgeSessionInput, startedAt: string) {
    const { error } = await this.sb.from("urge_sessions").insert({
      user_id: await this.userId(),
      started_at: startedAt,
      game: input.game,
      duration_s: input.durationS,
      intensity_before: input.intensityBefore,
      intensity_after: input.intensityAfter,
      completed: input.completed,
    });
    if (error) throw toStoreError(error);
  }

  async updatePreferences(p: Parameters<WillWarStore["updatePreferences"]>[0]) {
    const patch: Row = {};
    if (p.tone) patch.tone = p.tone;
    if (p.whyTags) patch.why_tags = p.whyTags;
    if (p.discreetNotifications !== undefined) patch.discreet_notifications = p.discreetNotifications;
    if (p.leaderboardVisibility) patch.leaderboard_visibility = p.leaderboardVisibility;
    if (p.showBackedBadge !== undefined) patch.show_backed_badge = p.showBackedBadge;
    if (p.reminderTime) patch.reminder_time = p.reminderTime;
    if (p.nightWatch !== undefined) patch.night_watch = p.nightWatch;
    const { error } = await this.sb.from("profiles").update(patch).eq("id", await this.userId());
    if (error) throw toStoreError(error);
  }

  async setTimezone(tz: string) {
    await this.rpc("set_timezone", { p_timezone: tz });
  }

  async startGoal(input: { seasonId: string | null; endsOn: string | null }) {
    await this.rpc("start_goal", { p_ends_on: input.endsOn, p_season: input.seasonId });
  }

  warChestOfferEligible() {
    return this.rpc<boolean>("war_chest_offer_eligible");
  }

  async markWarChestOffered() {
    await this.rpc("mark_war_chest_offered");
  }

  async createPromiseChest(input: Parameters<WillWarStore["createPromiseChest"]>[0]) {
    await this.rpc("create_promise_chest", {
      p_amount_minor: input.amountMinor,
      p_currency: input.currency,
      p_rule: input.forfeitRule,
      p_cause: input.causeId,
    });
  }

  async cancelWarChest() {
    return this.rpc<"cancelled" | "refund_pending">("cancel_war_chest");
  }

  async logEvent(name: AllowedEvent) {
    try {
      await this.rpc("log_event", { p_name: name });
    } catch {
      // Product events are best effort and never block the person.
    }
  }

  async sync(): Promise<number> {
    if (isOffline()) return 0;
    const q = (await kvGet<QueueItem[]>(QUEUE_KEY)) ?? [];
    if (q.length === 0) return 0;
    let sent = 0;
    const rest: QueueItem[] = [];
    for (const item of q) {
      try {
        if (item.kind === "checkin") {
          // The server decides the date; a duplicate for the same day is a no-op.
          const { error } = await this.sb.rpc("check_in");
          if (error && !/no_open_streak/.test(error.message)) throw error;
        } else {
          await this.insertUrge(item.input, item.startedAt);
        }
        sent++;
      } catch {
        rest.push(item);
      }
    }
    if (rest.length) await kvSet(QUEUE_KEY, rest);
    else await kvDelete(QUEUE_KEY);
    return sent;
  }

  async exportData(): Promise<Blob> {
    const res = await fetch("/api/account/export", { method: "POST" });
    if (!res.ok) throw new StoreError("unknown");
    return res.blob();
  }

  async deleteAccount(): Promise<void> {
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: "delete" }),
    });
    if (res.status === 409) {
      throw new StoreError("refund_first", "We're returning your War Chest first. Try again in a few minutes.");
    }
    if (!res.ok) throw new StoreError("unknown");
    await this.signOut();
  }

  async signOut(): Promise<void> {
    await this.sb.auth.signOut();
    await kvDelete(SNAPSHOT_KEY);
    await kvDelete(QUEUE_KEY);
  }
}
