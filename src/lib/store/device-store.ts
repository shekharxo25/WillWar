"use client";

import { RuleError } from "@/lib/domain/rules";
import { DeviceEngine, type DeviceState, emptyState } from "./device-engine";
import { kvDelete, kvGet, kvSet } from "./kv";
import { StoreError, type AllowedEvent, type LoadResult, type WillWarStore } from "./types";

const KEY = "device-state";

/**
 * Device mode: nothing leaves this device. State lives in one IndexedDB record so
 * each write is atomic. Used when the build has no Supabase configuration.
 */
export class DeviceStore implements WillWarStore {
  readonly mode = "device" as const;
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<DeviceState> {
    return (await kvGet<DeviceState>(KEY)) ?? emptyState();
  }

  /** Serialises read-modify-write so two taps can't interleave. */
  private mutate<T>(fn: (engine: DeviceEngine) => T): Promise<T> {
    const run = async () => {
      const engine = new DeviceEngine(await this.read(), { now: () => new Date(), id: () => crypto.randomUUID() });
      try {
        const result = fn(engine);
        await kvSet(KEY, engine.state);
        return result;
      } catch (e) {
        if (e instanceof RuleError) throw new StoreError(e.code);
        throw e;
      }
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async load(): Promise<LoadResult> {
    return this.mutate((engine) => {
      engine.settleDue();
      const snapshot = engine.snapshot();
      return snapshot ? { status: "ready" as const, snapshot } : { status: "needs-onboarding" as const };
    });
  }

  async checkHandleAvailable(): Promise<boolean> {
    return true; // handles are only unique across accounts
  }

  completeOnboarding: WillWarStore["completeOnboarding"] = (input) => this.mutate((e) => e.completeOnboarding(input));
  signPledge = () => this.mutate((e) => e.signPledge());
  checkIn: WillWarStore["checkIn"] = () =>
    this.mutate((e) => {
      const c = e.checkIn();
      return { status: "held" as const, localDate: c.localDate, queued: false };
    });
  logReset: WillWarStore["logReset"] = (tags) => this.mutate((e) => ({ forfeitMinor: e.logReset(tags) }));
  useShield: WillWarStore["useShield"] = (d) => this.mutate((e) => e.useShield(d));
  grantRewardedShield = () => this.mutate((e) => e.grantRewardedShield());
  saveUrgeSession: WillWarStore["saveUrgeSession"] = (input) => this.mutate((e) => e.saveUrgeSession(input));
  updatePreferences: WillWarStore["updatePreferences"] = (p) => this.mutate((e) => e.updatePreferences(p));
  setTimezone: WillWarStore["setTimezone"] = (tz) => this.mutate((e) => e.setTimezone(tz));
  startGoal: WillWarStore["startGoal"] = (input) => this.mutate((e) => e.startGoal(input));
  warChestOfferEligible = () => this.mutate((e) => e.warChestOfferEligible());
  markWarChestOffered = () => this.mutate((e) => e.markWarChestOffered());
  createPromiseChest: WillWarStore["createPromiseChest"] = (input) => this.mutate((e) => e.createPromiseChest(input));
  cancelWarChest = () => this.mutate((e) => e.cancelWarChest());
  logEvent = (name: AllowedEvent) => this.mutate((e) => e.logEvent(name));

  async sync(): Promise<number> {
    return 0;
  }

  async exportData(): Promise<Blob> {
    const state = await this.read();
    return new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), mode: "device", ...state }, null, 2)], {
      type: "application/json",
    });
  }

  async deleteAccount(): Promise<void> {
    await kvDelete(KEY);
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("ww-")) localStorage.removeItem(k);
    } catch {
      // storage unavailable; nothing else to clear
    }
  }

  async signOut(): Promise<void> {
    // Device mode has no session; signing out would mean deleting, which needs explicit consent.
  }
}
