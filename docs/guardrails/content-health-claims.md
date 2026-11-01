# Content and health claims

Non-negotiable 4: no health claims in UI copy, ever. Articles need an evidence grade, sources and a reviewer.

## What the evidence says

- The "testosterone peaks on day 7" claim comes from a 2003 study that was later retracted; no research since shows a lasting hormonal effect.
- A large 2016 cohort study linked more frequent ejaculation (not less) with lower prostate cancer risk (an association).
- Semen retention is one of the most common categories of male health misinformation online.
- Google's publisher policies prohibit content promoting harmful health claims that contradict scientific consensus, so this also protects ad revenue.

## Never state or imply that abstaining from masturbation or ejaculation

- raises testosterone, energy, strength or muscle in a lasting way
- gives "superpowers", "aura", "magnetism", charisma, or makes anyone more attractive
- improves erections, cures erectile dysfunction or premature ejaculation, or increases fertility
- prevents prostate cancer or any disease
- cures depression, anxiety, ADHD or brain fog
- is required for spiritual, moral or masculine worth

Also never state that masturbation causes hair loss, blindness, acne, brain damage or "low T", and never describe "porn addiction" as a settled diagnosis that applies to everyone.

These may appear only inside a Myth-graded article, quoted and clearly labeled as the claim being checked. `npm run content:check` enforces the list, and also flags War Chest loss language (lost, penalty, fine, wasted).

## Articles

Frontmatter (Zod-validated at build): `title`, `slug`, `summary`, `evidence` (strong | moderate | mixed | myth), `reviewed_by`, `reviewed_on`, `sources` (at least one). Missing fields fail the build. Drafts (empty `reviewed_by`) are excluded from production.

Every article ends with: "Not medical advice. If this is affecting your life, talk to a doctor or counselor."

## Seed articles (agent drafts, founder reviews)

| # | Title | Grade |
|---|---|---|
| 1 | The day-7 testosterone claim, traced to its source | Myth |
| 2 | Ejaculation frequency and prostate health: what one big study found | Moderate |
| 3 | Urges crest and fall: how urge surfing works | Moderate |
| 4 | Three minutes of a puzzle versus a craving | Moderate |
| 5 | Why one slip turns into a week, and how to stop it | Moderate |
| 6 | If-then plans: the simplest tool with strong evidence | Strong |
| 7 | Late nights, phones and urges | Mixed |
| 8 | Exercise as an urge tool | Moderate |
| 9 | Compulsive sexual behaviour: when to get help | Strong |
| 10 | Is "porn addiction" real? What clinicians actually say | Mixed |
| 11 | Superpowers, aura and attraction: the claims checked | Myth |
| 12 | Doing a challenge with friends: does accountability help? | Mixed |

`/day/[n]` pages give a practical tip and the next milestone, with no physiological claims.
