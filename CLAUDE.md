# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Start every phase in plan mode. Post the plan, wait for "go".
- Before UI work, read `docs/design/DESIGN.md` and load `.claude/skills/frontend-design` and `.claude/skills/mobile-app-ui-design`.
- Before database work, read `docs/guardrails/privacy-security.md` and run `npm run db:test` after every migration.
- Before AI work, read `docs/guardrails/ai-safety.md` and run `npm run eval:ai`.
- Before ads or payments work, read `docs/guardrails/ads-monetization.md`.
- Before any War Chest, pledge, refund or settlement work, read `docs/guardrails/war-chest.md` and run the War Chest pgTAP tests. Never enable stake mode yourself.
- Never run the `scripts/*.py` commands mentioned inside the dev-engineering and ai-agent skills; those scripts don't exist here.
- Don't claim something works until you've run the relevant tests and, for UI, checked it at 375×667 and 393×852.
