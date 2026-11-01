/**
 * Handle and camp-name screening. Handles: 3-20 lowercase letters, numbers, underscores.
 * The blocklist catches slurs, sexual terms and impersonation. Matching ignores digits and
 * underscores so "s_l_u_r" or "sl0r"-style spacing still collides with the stem list.
 * Pure (no server-only import) so it can be unit tested and shared.
 */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

const BLOCKED_STEMS = [
  // slurs and hate
  // (stems that collide with ordinary words, like "spic" in "spicy" or "sex" in "essex", are left out)
  "nigg", "fagg", "faggot", "kike", "chink", "tranny", "retard", "nazi", "hitler", "kkk",
  // profanity
  "fuck", "shit", "cunt", "bitch", "bastard", "asshole", "wank",
  // sexual
  "porn", "sexy", "sexx", "slut", "whore", "rape", "dick", "cock", "pussy", "penis", "vagina", "boob", "tits", "horny", "nude", "milf",
  "masturbat", "ejaculat", "orgasm", "fap",
  // brand and impersonation
  "willwar", "admin", "support", "moderator", "official", "staff",
];

const RESERVED = new Set(["you", "me", "root", "null", "undefined", "system", "help", "camp", "today", "learn"]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
}

export function nameIsClean(s: string): boolean {
  const n = normalize(s);
  return !BLOCKED_STEMS.some((stem) => n.includes(stem));
}

export type HandleCheck = { ok: true } | { ok: false; reason: "format" | "not_allowed" | "reserved" };

export function checkHandle(raw: string): HandleCheck {
  const h = raw.trim();
  if (!HANDLE_RE.test(h)) return { ok: false, reason: "format" };
  if (RESERVED.has(h)) return { ok: false, reason: "reserved" };
  if (!nameIsClean(h)) return { ok: false, reason: "not_allowed" };
  return { ok: true };
}

export function checkCampName(raw: string): boolean {
  const n = raw.trim();
  return n.length >= 2 && n.length <= 40 && nameIsClean(n);
}
