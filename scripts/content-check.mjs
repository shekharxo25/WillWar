// npm run content:check — content guardrail lint (docs/guardrails/content-health-claims.md).
// 1. Banned health claims may appear only inside Myth-graded articles, in quotes.
// 2. Shame words never appear in articles.
// 3. War Chest UI never uses loss language ("lost", "penalty", "fine", "wasted").
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const { ALL_ARTICLES } = await import("../src/lib/learn/articles.ts");

const CLAIMS = [
  [/\b(boost|boosts|raise|raises|increase|increases|higher)\b[^.]{0,30}\btestosterone\b/i, "testosterone claim"],
  [/\b(superpowers?|aura|magnetism|charisma)\b/i, "superpower/aura claim"],
  [/\b(more attractive|attracts? (women|men|people))\b/i, "attraction claim"],
  [/\b(improve|improves|cure|cures|fix|fixes)\b[^.]{0,20}\b(erections?|erectile|premature)\b/i, "erection claim"],
  [/\b(increase|increases|boost|boosts)\b[^.]{0,20}\bfertility\b/i, "fertility claim"],
  [/\b(prevent|prevents|protects? against)\b[^.]{0,20}\b(prostate cancer|cancer|disease)\b/i, "disease prevention claim"],
  [/\b(cure|cures|treat|treats)\b[^.]{0,20}\b(depression|anxiety|adhd|brain fog)\b/i, "mental health cure claim"],
  [/\b(causes?|leads? to)\b[^.]{0,20}\b(hair loss|blindness|acne|brain damage|low t)\b/i, "harm myth stated as fact"],
];
const SHAME = /\b(failure|weak|dirty|degenerate|loser)\b/i;
const LOSS = /\b(lost|penalty|penalties|fine|fined|wasted)\b/i;

const problems = [];
const stripQuotes = (t) => t.replace(/"[^"]*"|“[^”]*”/g, " ");

for (const a of ALL_ARTICLES) {
  const texts = [a.summary, a.supports, a.doesNotSupport, ...a.body];
  if (a.evidence !== "myth") texts.push(a.title);
  for (const raw of texts) {
    const t = a.evidence === "myth" ? stripQuotes(raw) : raw;
    for (const [re, label] of CLAIMS) if (re.test(t)) problems.push(`${a.slug}: ${label} — "${raw.slice(0, 80)}"`);
    if (SHAME.test(raw)) problems.push(`${a.slug}: shame word — "${raw.slice(0, 80)}"`);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") || p.endsWith(".ts") ? [p] : [];
  });
}
for (const file of walk("src/components/war-chest")) {
  // Only user-facing text: string literals and JSX text, not identifiers or comments.
  const src = readFileSync(file, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const strings = src.match(/"[^"\n]*"|`[^`]*`|>[^<>{}]+</g) ?? [];
  for (const s of strings) if (LOSS.test(s)) problems.push(`${file}: loss language — ${s.slice(0, 80)}`);
}

if (problems.length) {
  console.error(`content:check failed (${problems.length})`);
  for (const p of problems) console.error(" - " + p);
  process.exit(1);
}
console.log(`content:check passed: ${ALL_ARTICLES.length} articles, War Chest copy clean.`);
