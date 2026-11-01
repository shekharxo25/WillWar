"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SEASON } from "@/lib/config/season";
import { localDate } from "@/lib/time";
import { enqueue } from "@/lib/offline/queue";
import type { BoardRow, Camp, Challenge, Snapshot, Store, Profile } from "./types";
import { StoreError } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function fail(error: { message?: string } | null): never {
  const msg = error?.message ?? "unknown";
  const code = msg.match(/^[a-z_0-9]+$/) ? msg : (msg.match(/([a-z_]{4,40})/)?.[1] ?? "unknown");
  throw new StoreError(code, msg);
}
async function rpc<T = unknown>(sb: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(fn, args);
  if (error) fail(error);
  return data as T;
}
const offline = () => typeof navigator !== "undefined" && navigator.onLine === false;

export function cloudStore(sb: SupabaseClient): Store {
  return {
    mode: "cloud",
    async load() {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return null;
      const id = u.user.id;
      const [p, st, ci, rs, us, g, sh, en, wc] = await Promise.all([
        sb.from("profiles").select("*").eq("id", id).maybeSingle(),
        sb.from("streaks").select("id, started_at, ended_at").order("started_at"),
        sb.from("checkins").select("local_date, status, created_at").order("local_date"),
        sb.from("resets").select("id, occurred_at, tags").order("occurred_at"),
        sb.from("urge_sessions").select("*").order("started_at"),
        sb.from("goals").select("*").is("closed_at", null).maybeSingle(),
        sb.from("shields").select("*"),
        sb.from("entitlements").select("*").maybeSingle(),
        sb.from("war_chests").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!p.data) return null;
      const r: any = p.data;
      const profile: Profile = {
        id: r.id, handle: r.handle, avatarSeed: r.avatar_seed, timezone: r.timezone, tone: r.tone, whyTags: r.why_tags,
        discreetNotifications: r.discreet_notifications, leaderboardVisibility: r.leaderboard_visibility,
        showBackedBadge: r.show_backed_badge, warChestOfferedAt: r.war_chest_offered_at, createdAt: r.created_at, country: null,
      };
      const goalRow: any = g.data;
      const chest: any = wc.data;
      let events: any[] = [];
      if (chest) {
        const ev = await sb.from("war_chest_events").select("*").eq("war_chest_id", chest.id).order("created_at");
        events = ev.data ?? [];
      }
      const snap: Snapshot = {
        profile,
        streaks: (st.data ?? []).map((x: any) => ({ id: x.id, startedAt: x.started_at, endedAt: x.ended_at })),
        checkins: (ci.data ?? []).map((x: any) => ({ localDate: x.local_date, status: x.status, createdAt: x.created_at })),
        resets: (rs.data ?? []).map((x: any) => ({ id: x.id, occurredAt: x.occurred_at, tags: x.tags })),
        urgeSessions: (us.data ?? []).map((x: any) => ({
          id: x.id, startedAt: x.started_at, game: x.game, durationS: x.duration_s, intensityBefore: x.intensity_before, intensityAfter: x.intensity_after, completed: x.completed,
        })),
        goal: goalRow
          ? {
              id: goalRow.id, seasonId: goalRow.season_id, endsOn: goalRow.ends_on, pledgeSignedAt: goalRow.pledge_signed_at, createdAt: goalRow.created_at, closedAt: goalRow.closed_at,
              startDate: goalRow.season_id === SEASON.id ? SEASON.startsOn : localDate(new Date(goalRow.created_at), profile.timezone),
            }
          : null,
        shields: (sh.data ?? []).map((x: any) => ({ id: x.id, source: x.source, grantedAt: x.granted_at, usedOn: x.used_on })),
        entitlement: en.data ? { plan: (en.data as any).plan, status: (en.data as any).status, currentPeriodEnd: (en.data as any).current_period_end } : null,
        warChest: chest
          ? {
              id: chest.id, goalId: chest.goal_id, mode: chest.mode, amountMinor: chest.amount_minor, currency: chest.currency, forfeitRule: chest.forfeit_rule,
              causeId: chest.cause_id, status: chest.status, forfeitedMinor: chest.forfeited_minor, fundedAt: chest.funded_at,
              coolingOffUntil: chest.cooling_off_until, settledAt: chest.settled_at, createdAt: chest.created_at,
            }
          : null,
        warChestEvents: events.map((e) => ({ id: e.id, kind: e.kind, amountMinor: e.amount_minor, createdAt: e.created_at })),
      };
      return snap;
    },
    async handleAvailable(handle) {
      const res = await fetch(`/api/handle?h=${encodeURIComponent(handle)}`);
      if (!res.ok) return false;
      return ((await res.json()) as { available: boolean }).available;
    },
    async completeOnboarding(i) {
      await rpc(sb, "complete_onboarding", {
        p_handle: i.handle, p_birth_date: i.birthDate, p_timezone: i.timezone, p_tone: i.tone, p_why: i.why,
        p_season: i.seasonId, p_ends_on: i.endsOn, p_started_at: i.startedAt,
      });
      if (i.pledgeSigned) await rpc(sb, "sign_pledge");
    },
    async signPledge() {
      await rpc(sb, "sign_pledge");
    },
    async checkIn() {
      if (offline()) {
        await enqueue({ kind: "check_in" });
        return "held";
      }
      return rpc<"held">(sb, "check_in");
    },
    async logReset(tags) {
      return rpc<number>(sb, "log_reset", { p_tags: tags });
    },
    async spendShield(d) {
      await rpc(sb, "use_shield", { p_local_date: d });
    },
    async saveUrgeSession(u) {
      const { data } = await sb.auth.getUser();
      const row = {
        user_id: data.user?.id, started_at: u.startedAt, game: u.game, duration_s: u.durationS,
        intensity_before: u.intensityBefore, intensity_after: u.intensityAfter, completed: u.completed,
      };
      if (offline()) {
        await enqueue({ kind: "urge_session", row });
        return;
      }
      const { error } = await sb.from("urge_sessions").insert(row);
      if (error) fail(error);
    },
    async updatePreferences(p) {
      const { data } = await sb.auth.getUser();
      const row: Record<string, unknown> = {};
      if (p.tone) row.tone = p.tone;
      if (p.whyTags) row.why_tags = p.whyTags;
      if (p.discreetNotifications !== undefined) row.discreet_notifications = p.discreetNotifications;
      if (p.leaderboardVisibility) row.leaderboard_visibility = p.leaderboardVisibility;
      if (p.showBackedBadge !== undefined) row.show_backed_badge = p.showBackedBadge;
      const { error } = await sb.from("profiles").update(row).eq("id", data.user?.id ?? "");
      if (error) fail(error);
    },
    async startGoal(endsOn, seasonId) {
      await rpc(sb, "start_goal", { p_ends_on: endsOn, p_season: seasonId });
    },
    async changeEndDate(endsOn) {
      await rpc(sb, "change_goal_end", { p_ends_on: endsOn });
    },
    async warChestOfferEligible() {
      return rpc<boolean>(sb, "war_chest_offer_eligible");
    },
    async markWarChestOffered() {
      await rpc(sb, "mark_war_chest_offered");
    },
    async createPromiseChest(a, c, r, cause) {
      await rpc(sb, "create_promise_chest", { p_amount_minor: a, p_currency: c, p_rule: r, p_cause: cause });
    },
    async cancelWarChest() {
      return rpc<"cancelled" | "refund_pending">(sb, "cancel_war_chest");
    },
    async listCamps() {
      const { data, error } = await sb.from("camps").select("*").order("created_at");
      if (error) fail(error);
      return (data ?? []).map((c: any): Camp => ({ id: c.id, name: c.name, ownerId: c.owner_id, seasonId: c.season_id, inviteCode: c.invite_code, maxMembers: c.max_members, createdAt: c.created_at }));
    },
    async createCamp(name, seasonId) {
      return rpc<string>(sb, "create_camp", { p_name: name, p_season: seasonId });
    },
    async joinCamp(code) {
      return rpc<string>(sb, "join_camp", { p_code: code });
    },
    async leaveCamp(id) {
      await rpc(sb, "leave_camp", { p_camp: id });
    },
    async campLeaderboard(id) {
      const rows = await rpc<any[]>(sb, "camp_leaderboard", { p_camp: id });
      return (rows ?? []).map((r): BoardRow => ({
        memberId: r.member_id, handle: r.handle, avatarSeed: r.avatar_seed, currentStreakS: Number(r.current_streak_s),
        bestStreakS: Number(r.best_streak_s), daysKept: r.days_kept, lastCheckin: r.last_checkin, isBacked: r.is_backed, isMe: r.is_me,
      }));
    },
    async listChallenges(id) {
      const { data } = await sb.from("challenges").select("*").eq("camp_id", id);
      return (data ?? []).map((c: any): Challenge => ({ id: c.id, campId: c.camp_id, kind: c.kind, targetDays: c.target_days, startsAt: c.starts_at, endsAt: c.ends_at }));
    },
    async createChallenge(campId, kind, target, startsAt, endsAt) {
      await rpc(sb, "create_challenge", { p_camp: campId, p_kind: kind, p_target_days: target, p_starts_at: startsAt, p_ends_at: endsAt });
    },
    async sendNudge(campId, to, key) {
      await rpc(sb, "send_nudge", { p_camp: campId, p_to: to, p_message_key: key });
    },
    async grantShield() {
      const res = await fetch("/api/rewards/shield", { method: "POST" });
      if (!res.ok) throw new StoreError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "shield_failed");
    },
    async exportData() {
      const res = await fetch("/api/account/export", { method: "POST" });
      if (!res.ok) throw new StoreError("export_failed");
      return res.json();
    },
    async deleteAccount() {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new StoreError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "delete_failed");
      await sb.auth.signOut();
    },
  };
}
