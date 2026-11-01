/**
 * Curated fallback lines (content/corner-talk.json, 120 lines tagged by tone and day range).
 * Used when the model is unreachable, slow, or its drafts fail the filters twice.
 */
import { z } from "zod";
import raw from "../../../content/corner-talk.json";
import type { CornerContext } from "./prompts";
import { TONES } from "./prompts";

const Line = z.object({
  id: z.string(),
  tone: z.enum(TONES),
  minDay: z.number().int().min(0),
  maxDay: z.number().int().min(0),
  text: z.string().min(1),
});
const File = z.object({ reviewed_by: z.string(), reviewed_on: z.string(), note: z.string(), lines: z.array(Line).min(1) });

export const CORNER_LINES = File.parse(raw).lines;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function fillDay(text: string, day: number): string {
  return text.replaceAll("{day}", String(Math.max(1, day)));
}

/**
 * Deterministic per seed (e.g. user id + local date), so a user sees the same line all day.
 * Day 0 (pre-season) uses day-1 lines.
 */
export function fallbackLine(ctx: Pick<CornerContext, "tone" | "day">, seed = ""): string {
  const day = Math.max(1, ctx.day);
  let pool = CORNER_LINES.filter((l) => l.tone === ctx.tone && day >= l.minDay && day <= l.maxDay);
  if (!pool.length) pool = CORNER_LINES.filter((l) => l.tone === ctx.tone);
  const pick = pool[hash(`${seed}|${ctx.tone}|${day}`) % pool.length];
  return fillDay(pick.text, day);
}
