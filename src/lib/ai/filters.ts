/**
 * Output filters for model text (Part 8.3). Also used by content:check and for the fallback lines.
 * Stems match at the start of a word; whole words match exactly ("since" never matches "sin").
 * Keep scripts/content-check.mjs in sync if you change these lists.
 */
export const BANNED_STEMS = [
  "testosteron", "hormon", "sperm", "semen", "fertil", "erecti", "libido", "magnetis",
  "superpower", "porn", "masturbat", "ejaculat", "orgasm", "arous",
];
export const BANNED_WORDS = [
  "aura", "alpha", "attract", "attracts", "attractive", "horny", "nut", "sin", "sinful",
  "dirty", "weak", "loser", "failure", "pathetic", "disgusting",
];

/** AI stays out of money (Part 7.2 rule 12). */
export const MONEY_TERMS: RegExp[] = [
  /\bwar\s*chest\b/i, /\bmoney\b/i, /\bstakes?\b/i, /₹/, /\$/, /\brupees?\b/i, /\bdollars?\b/i, /\brefund/i, /\bforfeit/i,
];

export type FilterResult = { ok: true } | { ok: false; rule: string };

const EMOJI = /\p{Extended_Pictographic}/u;
const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|org|net|in|io|co|uk|app)\b)/i;
const PHONE_RE = /\+?\d[\d\s().-]{5,}\d/;

/** "No Nut November" is the event's name and the only place "nut" may appear. */
function stripEventName(text: string) {
  return text.replace(/no[\s-]+nut[\s-]+november/gi, " ");
}

export function bannedTerm(text: string): string | null {
  const t = stripEventName(text).toLowerCase();
  for (const s of BANNED_STEMS) if (new RegExp(`(^|[^\\p{L}])${s}`, "u").test(t)) return s;
  for (const w of BANNED_WORDS) if (new RegExp(`(^|[^\\p{L}])${w}($|[^\\p{L}])`, "u").test(t)) return w;
  return null;
}

export function moneyTerm(text: string): string | null {
  for (const r of MONEY_TERMS) if (r.test(text)) return r.source;
  return null;
}

export function formatProblem(text: string): string | null {
  if (EMOJI.test(text)) return "no emojis";
  if (text.includes("#")) return "no hashtags";
  if (text.includes("!")) return "no exclamation marks";
  if (URL_RE.test(text)) return "no URLs";
  if (PHONE_RE.test(text)) return "no phone numbers";
  return null;
}

export const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Full check for a corner talk line. */
export function checkCornerLine(text: string): FilterResult {
  const n = wordCount(text);
  if (n < 12 || n > 40) return { ok: false, rule: `12 to 40 words (the draft had ${n})` };
  const b = bannedTerm(text);
  if (b) return { ok: false, rule: `no banned terms ("${b}")` };
  if (moneyTerm(text)) return { ok: false, rule: "never mention money, stakes or the War Chest" };
  const f = formatProblem(text);
  if (f) return { ok: false, rule: f };
  return { ok: true };
}

/** Check applied to streamed coach output: banned terms and phone numbers. */
export function checkCoachText(text: string): FilterResult {
  const b = bannedTerm(text);
  if (b) return { ok: false, rule: `banned term "${b}"` };
  if (PHONE_RE.test(text)) return { ok: false, rule: "no phone numbers" };
  return { ok: true };
}
