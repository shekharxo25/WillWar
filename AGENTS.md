# WillWar — agent guide

WillWar is an 18+ Progressive Web App for the No Nut November season and rolling 30-day challenges. It installs from the browser and should feel like a native iPhone app. The core loop: a streak Clock styled as a gym interval timer, a daily "I held today" check-in, a judgment-free reset, and "Go a round": a three-minute visual game for riding out an urge (the length of a boxing round and of the craving-task studies). Around it: corner talk (a daily AI line), a Pro coach, camps (small friend boards), graded Learn articles, and an optional War Chest money commitment that runs in promise mode. The full specification is `MASTER_PROMPT.md`; the design system is `docs/design/DESIGN.md`.

## Stack

Next.js 16 (App Router, Cache Components off for Workers, `proxy.ts` instead of middleware), React 19, TypeScript strict, Tailwind CSS v4 with tokens in `src/styles/tokens.css`, Radix primitives, Phosphor icons, motion. Supabase (Postgres, Auth, RLS, Realtime, pg_cron, Edge Functions). Claude API for corner talk and the coach. Razorpay for payments. Cloudflare Workers via `@opennextjs/cloudflare`. Vitest, PGlite (local DB tests), pgTAP (CI), Playwright.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run typecheck      # next typegen + tsc
npm run lint           # ESLint
npm run test           # Vitest: unit + database (PGlite)
npm run db:test        # pgTAP via the Supabase CLI (CI)
npm run content:check  # banned health claims + War Chest loss language
npm run eval:ai        # AI safety cases (model cases need ANTHROPIC_API_KEY)
npm run icons          # regenerate PWA icons and iOS launch images
npm run preview        # OpenNext build + local workerd
npm run deploy         # OpenNext build + deploy to Cloudflare
```

The app runs with zero secrets: with no Supabase env it uses device mode (the record lives on the phone), and every outside service has a mock (`src/lib/adapters/`).

## Repo map

- `src/app/(marketing)/` landing page and static pages; `src/app/app/` the installed app (`/app/*`); `src/app/api/` route handlers
- `src/components/` `ui/` primitives, `clock/` the signature Clock, `games/` round games, `landing/` and `poster/`, `ads/`, `pro/`, `shell/` tab bar and PWA bits
- `src/lib/` `time/` pure time functions, `store/` device engine + cloud store (one interface), `config/`, `adapters/`, `ai/`, `supabase/`, `offline/`
- `supabase/` migrations, seed, tests, Edge Functions
- `content/` Learn articles and curated corner talk lines
- `docs/` design, guardrails, build plan, decisions, changelog, handoff

## The 13 non-negotiables

Breaking one needs the founder's written approval.

1. RLS on every table, enforced by CI; sensitive writes only through checked security definer functions or server routes with the secret key; the secret key never reaches the browser. → `docs/guardrails/privacy-security.md`
2. No free text about sexual behavior on the server: fixed reset tags, on-device journal, coach never stored, no message text in logs. → `privacy-security.md`, `ai-safety.md`
3. 18+ only: age gate before account creation, date of birth checked once and never stored. → `privacy-security.md`
4. No health claims in UI copy; articles need a grade, sources and a reviewer. → `content-health-claims.md`
5. AI output is validated, filtered and fails safe; crisis numbers come from config, never the model. → `ai-safety.md`
6. Ads only on allowlisted placements, non-personalized, sensitive categories blocked, none for Pro, never between a person and Go a round. → `ads-monetization.md`
7. Honest boards: server-derived dates, shields cover missed check-ins only, clients never set streak values, nobody sees anyone else's reset reasons or times. → `social-integrity.md`
8. Safety is never paywalled: Kitbag and Bag, reset, crisis resources, export and deletion are free. → `ads-monetization.md`
9. Design from tokens only; no SF Pro files, no SF Symbols, no AI-generated imagery; reduced motion, AA contrast, 44pt targets. → `docs/design/DESIGN.md`
10. Discreet by default: notifications, email subjects, manifest name and in-app titles never mention the challenge's subject. → `pwa-native-feel.md`
11. No new third-party scripts under `/app`; no session replay anywhere. → `privacy-security.md`
12. Verify before you use: read current docs for every library; ask before adding dependencies. → `docs/DECISIONS.md`
13. War Chest money is server-only and never WillWar's; offer once, never at vulnerable moments, nothing pre-selected, no money between users, stake mode off until legal sign-off. → `war-chest.md`

Before shipping, work through `docs/guardrails/release-checklist.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
