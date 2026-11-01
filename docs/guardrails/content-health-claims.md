# Guardrail: content and health claims

## Principle

WillWar supports people who choose a 30-day challenge. It does not claim the challenge does things to their body that research hasn't shown. Honest content is the brand, and it's also required: Google's publisher policies prohibit content that promotes harmful health claims contradicting scientific consensus, and content giving sexual-performance advice is restricted to fewer advertisers.

What the evidence actually says about the popular claims:

- The "testosterone peaks on day 7" claim comes from a 2003 study of 28 men. Levels rose briefly around day 7 and returned to baseline, and the paper was later retracted for duplicating earlier work. No research since has shown a lasting hormonal effect from abstinence.
- A large 2016 cohort study found that men who ejaculated more often had a lower risk of prostate cancer. It's an association, not proof of cause, but it points the opposite way from "retention is healthier".
- A 2022 study in the International Journal of Impotence Research listed semen retention among the most common categories of male health misinformation online.

What does hold up, and what WillWar can talk about confidently: choosing a goal and practicing self-control, planning for urges, the fact that urges rise and fall, visual-spatial tasks that weaken cravings, if-then planning, sleep and phone habits, exercise as a craving tool, social support, and knowing when to get professional help.

## Evidence grades (required on every article)

| Grade | Meaning |
|---|---|
| Strong | Consistent findings across systematic reviews, meta-analyses or clinical guidelines |
| Moderate | Several good studies point the same way, or one strong trial; limits stated |
| Mixed | Studies disagree, or evidence is thin or indirect |
| Myth | A popular claim that research doesn't support, or that rests on retracted or misread work |

## Required frontmatter

```yaml
title: "The day-7 testosterone claim, traced to its source"
slug: day-7-testosterone-claim
summary: "Where the number comes from, what the study found, and why it was retracted."
evidence: myth            # strong | moderate | mixed | myth
reviewed_by: ""           # empty = draft, excluded from build
reviewed_on: ""           # ISO date
sources:
  - title: "Jiang et al. 2003 (retracted)"
    url: "https://doi.org/10.1631/jzus.2003.0236"
```

The build fails if `evidence` or `sources` is missing on a published article. Articles are reviewed by the founder before publishing and, before scaling paid acquisition, by a clinician (urologist, psychiatrist or sex therapist). Every article is re-reviewed at least once a year.

## Banned claims (interface, articles, ads, AI output, marketing)

Never state or imply that abstaining from masturbation or ejaculation:

- raises testosterone, energy, strength or muscle in a lasting way
- gives "superpowers", "aura", "magnetism", charisma, or makes anyone more attractive
- improves erections, cures erectile dysfunction or premature ejaculation, or increases fertility
- prevents prostate cancer or any disease
- cures depression, anxiety, ADHD or brain fog
- is required for spiritual, moral or masculine worth

Also never state that masturbation causes hair loss, blindness, acne, brain damage or "low T", and never describe "porn addiction" as a settled diagnosis that applies to everyone.

These may appear only inside a Myth-graded article, quoted and clearly labeled as the claim being checked. `npm run content:check` enforces this list.

## Language rules

- Clinical and non-graphic. No slang for sex acts. "No Nut November" appears as the event's name only.
- No shame: never "failure", "weak", "dirty", "degenerate", "loser". Use "reset" or "slip".
- No moral or religious judgment. "Faith or values" is a reason users can choose; content respects it without preaching.
- Specific over hype. No exclamation-mark marketing.
- Every article ends with: "Not medical advice. If urges or habits are affecting your life, talk to a doctor or counselor." and a link to /support.

## Seed articles (drafts for Phase 8)

| # | Title | Grade | Key points (agent drafts, founder reviews) |
|---|---|---|---|
| 1 | The day-7 testosterone claim, traced to its source | Myth | 2003 study of 28 men; brief day-7 rise, back to baseline; retracted for duplication; no evidence of lasting change |
| 2 | Ejaculation frequency and prostate health: what one big study found | Moderate | 2016 cohort: more frequent ejaculation associated with lower prostate cancer risk; association, not cause; a 30-day challenge isn't shown to cause harm either; see a doctor with symptoms |
| 3 | Urges crest and fall: how urge surfing works | Moderate | Mindfulness-based relapse prevention; noticing the urge, riding it out, letting it pass; how Ride it out applies it |
| 4 | Three minutes of a puzzle versus a craving | Moderate | Plymouth studies (2014 lab, 2015 real world): about a 20% weaker craving after three minutes of a block puzzle, including for sex; why visual tasks crowd out craving imagery |
| 5 | Why one slip turns into a week, and how to stop it | Moderate | The abstinence violation effect from relapse-prevention research; why "I've blown it" thinking extends a slip; reset fast, without shame |
| 6 | If-then plans: the simplest tool with strong evidence | Strong | Implementation intentions research (meta-analytic support); write three if-then plans for your riskiest moments |
| 7 | Late nights, phones and urges | Mixed | Evidence on sleep, screens and self-control is mixed; practical environment design (phone out of the bedroom, Night watch) |
| 8 | Exercise as an urge tool | Moderate | Short bouts of exercise reduce cravings in substance research; transferable but not studied for this habit specifically |
| 9 | Compulsive sexual behaviour: when to get help | Strong | ICD-11 recognizes compulsive sexual behaviour disorder (6C72); signs of distress and loss of control; who to talk to; Tele-MANAS 14416 |
| 10 | Is "porn addiction" real? What clinicians actually say | Mixed | Debate between the addiction model and the compulsivity model; moral incongruence; why labels matter less than distress |
| 11 | Superpowers, aura and attraction: the claims checked | Myth | No evidence for any of them; where the claims come from; what people may genuinely notice (time, focus from fewer late nights) framed as personal experience, not physiology |
| 12 | Doing a challenge with friends: does accountability help? | Mixed | Social support and commitment devices help some people; public pressure can backfire into shame; how pacts are designed to avoid that |

## Day pages (/day/1–30)

Each page: the day number, one practical tip, the next milestone, a link to a relevant article, the CTA. No physiological "what's happening in your body" content.

## Ads and sponsors

Sponsors and house ads follow the same banned-claims list. No testosterone boosters, "male enhancement", supplements making body claims, dating apps or adult products, in any slot, ever.
