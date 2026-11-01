// Crisis pre-screen for coach input, run before any model call (ai-safety.md "Crisis
// protocol"). Over-matching is acceptable: a false positive shows support numbers; a false
// negative is the failure that matters. Reviewed quarterly.

const SELF_HARM: RegExp[] = [
  /\bkill(ing)? my ?self\b/i,
  /\bend (it all|my life)\b/i,
  /\b(don'?t|do not) want to (be here|live|be alive|exist)\b/i,
  /\bwant(ed)? to die\b/i,
  /\bsuicid/i,
  /\b(hurt|harm|cut|burn)(ing)? my ?self\b/i,
  /\bself[- ]?harm/i,
  /\bno reason to live\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\boverdose\b/i,
];

const HARM_OTHERS: RegExp[] = [/\b(kill|hurt|harm) (someone|somebody|him|her|them|people)\b/i];

const ABUSE: RegExp[] = [/\b(being|was|been|getting) (abused|assaulted|raped)\b/i, /\bsomeone is (hurting|abusing) me\b/i];

/** "I'm 15", "i am 16 years old", "im 17 yo", "15 year old here". */
const UNDER_18: RegExp[] = [
  /\b(i'?m|i am|im)\s+(1[0-7]|[5-9])\b(?!\s*(days?|weeks?|months?|minutes?|hours?|times?|%|th))/i,
  /\b(1[0-7]|[5-9])\s*(years?|yrs?|yo)\s*old\b/i,
  /\b(in|at) (middle|high) school\b/i,
  /\bmy (parents|mom|dad) (will|would) (find out|kill me)\b/i,
];

export type CrisisKind = "self_harm" | "harm_others" | "abuse" | "under_18";

export function crisisKind(input: string): CrisisKind | null {
  if (SELF_HARM.some((r) => r.test(input))) return "self_harm";
  if (HARM_OTHERS.some((r) => r.test(input))) return "harm_others";
  if (ABUSE.some((r) => r.test(input))) return "abuse";
  if (UNDER_18.some((r) => r.test(input))) return "under_18";
  return null;
}
