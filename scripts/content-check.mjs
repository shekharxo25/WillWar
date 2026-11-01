#!/usr/bin/env node
/**
 * npm run content:check
 *  1. Banned health claims (Part 7.4) in Learn articles and UI copy. Myth articles may quote a claim
 *     (blockquotes and quoted text); negated sentences ("No study shows...") are allowed everywhere.
 *  2. War Chest loss language (lost, penalty, fine, wasted, "you failed") in War Chest files.
 *  3. Every curated corner talk line passes the corner filters (same lists as src/lib/ai/filters.ts).
 * Exits non-zero on any violation.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const problems = [];
const report = (file, msg, text) => problems.push(`${relative(ROOT, file)}: ${msg}${text ? `\n    > ${text.trim().slice(0, 160)}` : ""}`);

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

/* ---------------- 1. Health claims ---------------- */
const CLAIMS = [
  [/\b(raises?|boosts?|increases?|elevates?|maximi[sz]es?|higher|more)\s+(your\s+)?(testosterone|t levels|energy|strength|muscles?)\b/i, "testosterone/energy/strength claim"],
  [/\b(gives?|grants?|unlocks?|get|develop)\s+(you\s+)?(superpowers?|an aura|aura|magnetism|charisma)\b/i, "superpowers/aura claim"],
  [/\b(makes?|become|becoming)\s+(you\s+)?(more\s+)?(attractive|magnetic|charismatic)\b/i, "attractiveness claim"],
  [/\b(cures?|fix(es)?|treats?|reverses?|improves?)\s+(your\s+)?(erectile|ed\b|erections?|premature ejaculation|depression|anxiety|adhd|brain fog)/i, "cure claim"],
  [/\b(increases?|boosts?|improves?)\s+(your\s+)?(fertility|sperm)/i, "fertility claim"],
  [/\b(prevents?|protects? (you )?(from|against))\s+(prostate cancer|cancer|disease)/i, "disease prevention claim"],
  [/\bmasturbation\s+causes\s+(hair loss|blindness|acne|brain damage|low t)/i, "harm myth stated as fact"],
  [/\b(required|necessary|essential)\s+for\s+(your\s+)?(spiritual|moral|masculine)\s+worth/i, "worth claim"],
  [/\bporn addiction is (a )?(proven|settled|real) (disease|diagnosis|addiction)/i, "settled-diagnosis claim"],
];
const NEGATED = /\b(no|not|never|nothing|none|isn't|aren't|doesn't|don't|didn't|won't|cannot|can't|myth|retracted|claims?)\b/i;

function scanClaims(file, text, { myth = false } = {}) {
  let t = text;
  if (myth) {
    t = t
      .split("\n")
      .filter((l) => !l.trim().startsWith(">"))
      .join("\n")
      .replace(/"[^"\n]*"|“[^”\n]*”|\\"[^"\n]*?\\"/g, " ");
  }
  for (const sentence of t.split(/(?<=[.?!])\s+|\n+/)) {
    if (NEGATED.test(sentence)) continue;
    for (const [re, label] of CLAIMS) if (re.test(sentence)) report(file, `banned health claim (${label})`, sentence);
  }
}

const articles = walk(join(ROOT, "content", "learn"), [".mdx", ".md"]);
if (articles.length === 0) report(join(ROOT, "content/learn"), "no articles found");
for (const f of articles) {
  const text = readFileSync(f, "utf8");
  const myth = /evidence:\s*["']myth["']/.test(text);
  if (!/sources:\s*\[\s*\{/.test(text)) report(f, "article has no sources");
  if (!/evidence:\s*["'](strong|moderate|mixed|myth)["']/.test(text)) report(f, "article has no valid evidence grade");
  scanClaims(f, text, { myth });
}

// UI copy. The AI prompt and filter files list banned terms as instructions, so they're excluded.
const EXCLUDE = [/src[\\/]lib[\\/]ai[\\/]/, /\.test\.tsx?$/, /src[\\/]lib[\\/]config[\\/]crisis-resources\.ts$/];
const srcFiles = walk(join(ROOT, "src"), [".ts", ".tsx"]).filter((f) => !EXCLUDE.some((re) => re.test(f)));
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
for (const f of srcFiles) scanClaims(f, stripComments(readFileSync(f, "utf8")));

/* ---------------- 2. War Chest loss language ---------------- */
const LOSS = /\b(lost|lose|loses|losing|penalty|penalties|penali[sz]ed?|fine|fined|fines|wasted|you failed)\b/i;
const chestFiles = srcFiles.filter((f) => /war[-_]?chest/i.test(relative(ROOT, f)));
for (const f of chestFiles) {
  const lines = stripComments(readFileSync(f, "utf8")).split("\n");
  lines.forEach((line, i) => {
    // Only user-facing text: string literals and JSX text, not identifiers.
    const strings = [...line.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);
    const jsxText = [...line.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
    for (const s of [...strings, ...jsxText]) {
      if (/^[a-z0-9_./@-]*$/i.test(s)) continue; // keys, paths, class names
      if (/\b(never|don't say|banned)\b/i.test(s)) continue;
      if (LOSS.test(s)) report(f, `War Chest loss language on line ${i + 1}`, s);
    }
  });
}

/* ---------------- 3. Corner talk lines ---------------- */
const BANNED_STEMS = ["testosteron", "hormon", "sperm", "semen", "fertil", "erecti", "libido", "magnetis", "superpower", "porn", "masturbat", "ejaculat", "orgasm", "arous"];
const BANNED_WORDS = ["aura", "alpha", "attract", "attracts", "attractive", "horny", "nut", "sin", "sinful", "dirty", "weak", "loser", "failure", "pathetic", "disgusting"];
const MONEY = [/\bwar\s*chest\b/i, /\bmoney\b/i, /\bstakes?\b/i, /₹/, /\$/, /\brupees?\b/i, /\bdollars?\b/i, /\brefund/i, /\bforfeit/i];
function cornerProblem(text) {
  const n = text.trim().split(/\s+/).length;
  if (n < 12 || n > 40) return `word count ${n}`;
  const t = text.replace(/no[\s-]+nut[\s-]+november/gi, " ").toLowerCase();
  for (const s of BANNED_STEMS) if (new RegExp(`(^|[^\\p{L}])${s}`, "u").test(t)) return `banned stem ${s}`;
  for (const w of BANNED_WORDS) if (new RegExp(`(^|[^\\p{L}])${w}($|[^\\p{L}])`, "u").test(t)) return `banned word ${w}`;
  if (MONEY.some((r) => r.test(text))) return "mentions money";
  if (/\p{Extended_Pictographic}/u.test(text)) return "emoji";
  if (/[#!]/.test(text)) return "# or !";
  if (/(https?:\/\/|www\.)/i.test(text)) return "URL";
  if (/\+?\d[\d\s().-]{5,}\d/.test(text)) return "phone number";
  return null;
}
const cornerFile = join(ROOT, "content", "corner-talk.json");
if (!existsSync(cornerFile)) report(cornerFile, "missing");
else {
  const { lines } = JSON.parse(readFileSync(cornerFile, "utf8"));
  if (!Array.isArray(lines) || lines.length !== 120) report(cornerFile, `expected 120 lines, found ${lines?.length}`);
  for (const l of lines) {
    const p = cornerProblem(l.text.replaceAll("{day}", String(Math.max(1, l.minDay))));
    if (p) report(cornerFile, `line ${l.id}: ${p}`, l.text);
  }
}

/* ---------------- Result ---------------- */
if (problems.length) {
  console.error(`content:check found ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`content:check passed: ${articles.length} articles, ${srcFiles.length} source files (${chestFiles.length} War Chest), corner talk lines OK.`);
