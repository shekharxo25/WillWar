"use client";
import * as E from "./engine";
import type { DeviceState } from "./engine";
import type { Store, Snapshot } from "./types";
import { StoreError } from "./types";

const KEY = "ww.device.v1";

function read(): DeviceState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DeviceState) : null;
  } catch {
    return null;
  }
}
function write(s: DeviceState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full or blocked: the in-memory state still works for this session */
  }
}
function must(): DeviceState {
  const s = read();
  if (!s) throw new StoreError("no_profile");
  return s;
}
function apply(fn: (s: DeviceState, now: Date) => DeviceState) {
  const now = new Date();
  write(fn(E.closeFinishedGoal(must(), now), now));
}

export function readDeviceState(): DeviceState | null {
  return read();
}

export const deviceStore: Store = {
  mode: "device",
  async load(): Promise<Snapshot | null> {
    const s = read();
    if (!s) return null;
    const closed = E.closeFinishedGoal(s, new Date());
    if (closed !== s) write(closed);
    return closed;
  },
  async handleAvailable(handle) {
    return /^[a-z0-9_]{3,20}$/.test(handle) && E.cleanName(handle) && !["rohan_k", "dev_s", "quietmile", "willwar", "admin", "support"].includes(handle);
  },
  async completeOnboarding(input) {
    write(E.completeOnboarding(input, new Date()));
  },
  async signPledge() {
    apply(E.signPledge);
  },
  async checkIn() {
    apply(E.checkIn);
    return "held";
  },
  async logReset(tags) {
    const now = new Date();
    const r = E.logReset(E.closeFinishedGoal(must(), now), tags, now);
    write(r.state);
    return r.forfeit;
  },
  async spendShield(date) {
    apply((s, now) => E.spendShield(s, date, now));
  },
  async saveUrgeSession(u) {
    apply((s, now) => E.saveUrgeSession(s, u, now));
  },
  async updatePreferences(p) {
    apply((s) => E.updatePreferences(s, p));
  },
  async startGoal(endsOn, seasonId) {
    apply((s, now) => E.startGoal(s, endsOn, seasonId, now));
  },
  async changeEndDate(endsOn) {
    apply((s, now) => E.changeEndDate(s, endsOn, now));
  },
  async warChestOfferEligible() {
    return E.warChestOfferEligible(must(), new Date());
  },
  async markWarChestOffered() {
    apply(E.markWarChestOffered);
  },
  async createPromiseChest(a, c, r, cause) {
    apply((s, now) => E.createPromiseChest(s, a, c, r, cause, now));
  },
  async cancelWarChest() {
    const now = new Date();
    const r = E.cancelWarChest(must(), now);
    write(r.state);
    return r.result;
  },
  async listCamps() {
    return must().camps.map((c) => { const { members, demoMembers, ...rest } = c; void members; void demoMembers; return rest; });
  },
  async createCamp(name, seasonId) {
    const now = new Date();
    const r = E.createCamp(must(), name, seasonId, now);
    write(r.state);
    return r.id;
  },
  async joinCamp(code) {
    const r = E.joinCamp(must(), code);
    write(r.state);
    return r.id;
  },
  async leaveCamp(id) {
    apply((s) => E.leaveCamp(s, id));
  },
  async campLeaderboard(id) {
    return E.campLeaderboard(must(), id, new Date());
  },
  async listChallenges(id) {
    return must().challenges.filter((c) => c.campId === id);
  },
  async createChallenge(campId, kind, target, startsAt, endsAt) {
    apply((s, now) => E.createChallenge(s, campId, kind, target, startsAt, endsAt, now));
  },
  async sendNudge(campId, to, key) {
    apply((s, now) => E.sendNudge(s, campId, to, key, now));
  },
  async grantShield(source) {
    apply((s, now) => E.grantShield(s, source, now));
  },
  async exportData() {
    const s = must();
    return { exportedAt: new Date().toISOString(), mode: "device", ...s };
  },
  async deleteAccount() {
    write(null);
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("ww.")) localStorage.removeItem(k);
    } catch {}
  },
  async devSetEntitlement(plan) {
    apply((s, now) => ({
      ...s,
      entitlement: plan
        ? { plan, status: "active", currentPeriodEnd: new Date(now.getTime() + (plan === "annual" ? 365 : 30) * 86400_000).toISOString() }
        : null,
    }));
  },
};

export function logDeviceEvent(name: string) {
  const s = read();
  if (s) write(E.logEvent(s, name, new Date()));
}
