// Output filters for model text (docs/guardrails/ai-safety.md "Output handling").
// Pure and dependency-free so the eval suite and the browser-free tests can use them.

/** Matched at the start of a word, case-insensitive. */
export const BANNED_STEMS = [
  "testosteron",
  "hormon",
  "sperm",
  "semen",
  "fertil",
  "erecti",
  "libido",
  "magnetis",
  "superpower",
  "porn",
  "masturbat",
  "ejaculat",
  "orgasm",
  "arous",
];

/** Exact words only, so "since" never matches "sin". */
export const BANNED_WORDS = [
  "aura",
  "alpha",
  "attract",
  "attracts",
  "attractive",
  "horny",
  "nut",
  "sin",
  "sinful",
  "dirty",
  "weak",
  "loser",
  "failure",
  "pathetic",
  "disgusting",
];

/** Morning lines and the coach never mention money (war-chest.md rule 12). */
export const MONEY_WORDS = ["war chest", "deposit", "stake", "stakes", "money", "rupee", "rupees", "dollar", "dollars", "₹", "$"];

const EMOJI = /\p{Extended_Pictographic}/u;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const PHONE_RE = /(\+?\d[\d\s-]{6,}\d)/;

export type FilterResult = { ok: true } | { ok: false; rule: string };

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

/** Banned stems/words, allowing "nut" only inside the event's name "No Nut November". */
export function bannedTerm(text: string): string | null {
  const cleaned = text.replace(/no nut november/gi, " ");
  const ws = words(cleaned);
  for (const w of ws) {
    const stem = BANNED_STEMS.find((s) => w.startsWith(s));
    if (stem) return `banned stem "${stem}"`;
    if (BANNED_WORDS.includes(w)) return `banned word "${w}"`;
  }
  return null;
}

export function moneyTerm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const m of MONEY_WORDS) {
    if (m.length <= 2 ? lower.includes(m) : new RegExp(`\\b${m}\\b`).test(lower)) return `money term "${m}"`;
  }
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

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Every rule a morning line must pass. */
export function checkMorningLine(text: string): FilterResult {
  const n = wordCount(text);
  if (n < 12 || n > 40) return { ok: false, rule: `12 to 40 words (got ${n})` };
  const problem = bannedTerm(text) ?? moneyTerm(text) ?? formatProblem(text);
  return problem ? { ok: false, rule: problem } : { ok: true };
}

/** Coach output check, applied to the streamed text so far. */
export function checkCoachText(text: string): FilterResult {
  const problem = bannedTerm(text) ?? moneyTermForCoach(text);
  return problem ? { ok: false, rule: problem } : { ok: true };
}

// The coach may answer a user who raises the War Chest ("it's yours to keep or release"),
// so only amounts and currency symbols are blocked there, not the words themselves.
function moneyTermForCoach(text: string): string | null {
  return /[₹$]\s?\d/.test(text) ? "money amount" : null;
}
