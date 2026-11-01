@AGENTS.md

# Claude Code notes

- Plan before large changes. Keep a todo list for anything with more than three steps.
- Read `docs/design/DESIGN.md` before any UI work. Every visual value comes from `src/styles/tokens.css`.
- Read the matching guardrail before touching these areas:
  - database or RLS: `docs/guardrails/privacy-security.md`
  - corner talk, coach, prompts, filters: `docs/guardrails/ai-safety.md`
  - articles or any UI copy about health: `docs/guardrails/content-health-claims.md`
  - ads, pricing, paywall: `docs/guardrails/ads-monetization.md`
  - payments or the War Chest: `docs/guardrails/war-chest.md`
  - camps and boards: `docs/guardrails/social-integrity.md`
  - PWA, iOS, notifications: `docs/guardrails/pwa-native-feel.md`
- Cache Components is on. No `Date.now()`, `new Date()` or `Math.random()` during prerender; time-based UI renders after mount (`useNow()` in `src/components/AppProvider.tsx`).
- The device engine (`src/lib/store/engine.ts`) mirrors the SQL functions. Change both together and keep their tests in step.
- Run typecheck, lint, tests and a production build before claiming something is done. Say what you ran.
- Never run the `scripts/*.py` tools mentioned in the engineering skills; they don't exist here.
- Never enable War Chest stake mode (`NEXT_PUBLIC_WAR_CHEST_MODE=stake`). It waits for the legal sign-off in `docs/guardrails/war-chest.md`.
- Don't add dependencies without asking. Log library or spec deviations in `docs/DECISIONS.md`.
- Commit with conventional messages.
