/**
 * Crisis pre-screen for coach input (Part 8.4). Reviewed quarterly.
 * Runs before the model is called and errs on the side of showing the card.
 */
const SELF_HARM: RegExp[] = [
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bkms\b/i,
  /\bsuicid/i,
  /\bend\s+(it\s+all|my\s+life)\b/i,
  /\b(don'?t|do\s+not|dont)\s+want\s+to\s+(be\s+here|live|exist|wake\s+up)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bwish\s+i\s+(was|were)\s+dead\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\b(hurt|harm|cut|burn)(ing)?\s+my\s*self\b/i,
  /\bself[-\s]?harm/i,
  /\boverdos(e|ing)\b/i,
];
const HARM_OTHERS: RegExp[] = [/\b(kill|hurt|harm|attack|stab)\s+(him|her|them|someone|somebody|people|everyone)\b/i];
const ABUSE: RegExp[] = [
  /\b(being|been|was|am|i'?m|im)\s+(abused|molested|assaulted|raped)\b/i,
  /\bsomeone\s+(is\s+)?(hurting|abusing|touching)\s+me\b/i,
  /\b(he|she|they)\s+(hits?|beats?)\s+me\b/i,
];

const NOT_AGE_UNIT = /^\s*(days?|d\b|hours?|hrs?|h\b|weeks?|wks?|w\b|months?|minutes?|mins?|times?|rounds?|in\b|out\s+of|of\b|%|th\b|st\b|nd\b|rd\b|\/|:|\.\d|\d|-?day)/i;

/** Under-18 statements: "I'm 15", "im 16", "I am 17 years old", "I'm only 14". Not "I'm 16 days in". */
function under18(text: string): boolean {
  const re = /\b(?:i'?m|i\s+am|im)\s+(?:only\s+|just\s+)?(\d{1,2})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    const rest = text.slice(m.index + m[0].length);
    if (n >= 5 && n <= 17 && !NOT_AGE_UNIT.test(rest)) return true;
  }
  if (/\b(1[0-7]|[5-9])\s*(years?\s+old|yrs?\s+old|y\/o|yo)\b/i.test(text)) return true;
  if (/\b(in|at)\s+(middle|high)\s+school\b/i.test(text)) return true;
  if (/\b(under\s*18|underage)\b/i.test(text)) return true;
  return false;
}

export type CrisisHit = { crisis: true; under18: boolean } | { crisis: false };

export function screenCrisis(text: string): CrisisHit {
  const t = text.replace(/[’‘]/g, "'");
  if (under18(t)) return { crisis: true, under18: true };
  if ([...SELF_HARM, ...HARM_OTHERS, ...ABUSE].some((r) => r.test(t))) return { crisis: true, under18: false };
  return { crisis: false };
}
