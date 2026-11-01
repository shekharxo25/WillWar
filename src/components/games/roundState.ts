"use client";
import type { Game } from "@/lib/store/types";
import type { GameSummary } from "./types";

/** Round flow state between R1-R5, kept in sessionStorage (never in URLs). */
export type RoundState = {
  before: number | null;
  game?: Game;
  startedAt?: string;
  durationS?: number;
  completed?: boolean;
  after?: number | null;
  summary?: GameSummary;
  saved?: boolean;
};

const KEY = "ww.round";

export function readRound(): RoundState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RoundState) : null;
  } catch {
    return null;
  }
}

export function writeRound(s: RoundState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: the flow still works within this page */
  }
}

export function patchRound(p: Partial<RoundState>) {
  writeRound({ ...(readRound() ?? { before: null }), ...p });
}

/** Rounds lasted in this browser session when there's no saved profile. */
export function bumpSessionRounds(): number {
  try {
    const n = Number(sessionStorage.getItem("ww.round.count") ?? "0") + 1;
    sessionStorage.setItem("ww.round.count", String(n));
    return n;
  } catch {
    return 1;
  }
}

export function sessionRounds(): number {
  try {
    return Number(sessionStorage.getItem("ww.round.count") ?? "0");
  } catch {
    return 0;
  }
}

/** Round bell preference (Settings → "Round bell"). Off by default. */
export function bellOn(): boolean {
  try {
    return localStorage.getItem("ww.bell") === "1";
  } catch {
    return false;
  }
}
