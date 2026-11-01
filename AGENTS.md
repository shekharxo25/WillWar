# AGENTS.md — WillWar

Instructions for every AI coding agent working in this repo (Claude Code, GitHub Copilot, Codex, Cursor, Cline). Read this file, then the guardrail doc for the area you're touching, before writing code.

## What WillWar is

An 18+ Progressive Web App for the No Nut November challenge and rolling 30-day resets. A landing page at `/` and an installable app at `/app`: the Tide streak clock, daily check-ins, AI morning lines, Ride it out urge games, friend pacts with leaderboards, evidence-graded articles, a free signed pledge, and the War Chest (an optional money commitment offered once; forfeits go to a cause, never to us). Free with ads; Pro behind a hard paywall.

The data is about people's sexual behavior. A competitor in this category exposed hundreds of thousands of users' intimate data through a misconfigured backend. Treat every decision as if a security researcher will probe it tomorrow, because one will.

## Stack

Next.js 16 (App Router, TypeScript strict) on Cloudflare Workers via `@opennextjs/cloudflare` · Supabase (Postgres, Auth, RLS, Realtime, pg_cron, Edge Functions) · Tailwind v4 with tokens from `docs/design/DESIGN.md` · Serwist service worker · Claude API for morning lines and the coach · Razorpay · AdSense and H5 Games Ads behind an `AdSlot` abstraction · Turnstile · Vitest, Playwright, pgTAP.

## Commands

```
npm run dev            # Next dev server (Turbopack)
npm run build          # Next build
npm run preview        # OpenNext build + local workerd preview (closest to production)
npm run deploy         # OpenNext build + deploy to Cloudflare
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run test           # Vitest
npm run test:e2e       # Playwright (iPhone 15, Pixel 8)
npm run db:test        # supabase test db (pgTAP, includes the RLS gate)
npm run db:lint        # supabase db lint
npm run eval:ai        # AI safety eval suite
npm run content:check  # MDX evidence + banned-claims lint (+ War Chest loss-language check)
```

Run typecheck, lint, test and db:test before saying anything is done.

## Repo map

```
src/app/(marketing)    landing, learn, day pages, legal
src/app/app            the PWA (scope /app): today, urge, pact, learn, me, settings, pro
src/app/api            route handlers
src/components         ui/, tide/, games/, ads/
src/lib                supabase/, ai/, time/, offline/, payments/, config/
content/               learn MDX, affirmations.json, sponsors.json
supabase/              migrations/, tests/, functions/
docs/                  design/DESIGN.md, guardrails/, BUILD_PLAN.md, CHANGELOG.md, runbooks/
design/exports/        Open Design references (DESIGN.md wins on conflict)
.claude/skills/        frontend-design, mobile-app-ui-design, dev-engineering-super-skill, ai-agent-super-skill
```

## Non-negotiables

Breaking one of these needs the founder's written approval in the PR. If one blocks you, stop and ask.

1. **RLS on every table.** No table in `public` without Row Level Security; CI fails if one appears. Sensitive writes (streaks, check-ins, resets, entitlements, affirmations, shields) go only through `security definer` functions with `set search_path = ''`, or through server routes using the secret key. The secret key never reaches the browser and never has a `NEXT_PUBLIC_` prefix. → `docs/guardrails/privacy-security.md`
2. **No free text about sexual behavior on the server.** Reset reasons are fixed tags. The journal lives on the device (encrypted backup is opt-in). Coach conversations are never stored server-side. Logs and analytics never contain message text.
3. **18+ only.** The age gate comes before account creation. Date of birth is checked once and never stored. Nothing is collected from under-18s.
4. **No health claims.** Interface copy makes none. Articles need an evidence grade, sources and a reviewer, or the build fails. → `docs/guardrails/content-health-claims.md`
5. **AI output is filtered and fails safe.** Schema validation, banned-claims and shame filters, curated fallback lines, and the crisis protocol with resource numbers from config (never from the model). → `docs/guardrails/ai-safety.md`
6. **Ads only on allowlisted placements.** Never on Today, the urge flow before or during a game, reset, onboarding, stats or settings. Non-personalized. Sensitive categories blocked. Pro sees none. → `docs/guardrails/ads-monetization.md`
7. **Leaderboards stay honest.** The server derives dates. Shields cover missed check-ins, never resets. Clients never set streak values. Nobody sees anyone else's reset reasons or times. → `docs/guardrails/social-integrity.md`
8. **Safety features are never paywalled.** Ride it out (Drift and Swell), reset, crisis resources, data export and account deletion are free.
9. **Design from tokens.** Every value comes from `docs/design/DESIGN.md`. No SF Pro files, no SF Symbols (Apple-platform license only); use the system-ui stack and Phosphor. Reduced motion, AA contrast, 44pt targets. → `docs/guardrails/design-implementation.md`
10. **Discreet by default.** Notification copy, email subjects, the manifest name and in-app page titles never mention the challenge's subject unless the user turns discretion off.
11. **No new third-party scripts under `/app`** without approval. No session replay anywhere.
12. **Verify before you use.** Check current docs for any library API; prefer the stack above; ask before adding a dependency.
13. **War Chest money is server-only and never ours.** Only server code with the secret key creates, activates, refunds or settles a stake. Forfeits go to the user's chosen cause. The offer appears once, never during Ride it out, at night, after a crisis card, or near ads or the paywall. No pre-selected amounts. No money between users, ever (no pots, bets or cash prizes). Stake mode stays off until the legal sign-off in the guardrail is complete. → `docs/guardrails/war-chest.md`

## Skills

Load the relevant skill in `.claude/skills/` for UI, mobile, engineering or AI work. `dev-engineering-super-skill` and `ai-agent-super-skill` mention `scripts/*.py` tools and Perplexity features that don't exist in this repo. Use their guidance; never try to run those scripts.

## Working style

- Plan first, wait for "go", then implement in small conventional commits.
- Server Components by default; client components only for interaction, browser APIs or animation.
- TypeScript strict, no `any`; Zod at every boundary.
- Every screen ships with empty, loading, offline and error states.
- Tests accompany every change. Never weaken a test or guardrail to get green.
- End each task with: what changed, how to verify on a phone, and follow-ups.
