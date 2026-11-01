# Copilot instructions

Read `AGENTS.md` first. Design rules: `docs/design/DESIGN.md`. Product rules: `docs/guardrails/`.

The 13 non-negotiables:

1. RLS on every table; sensitive writes only via checked security definer functions or secret-key server routes; the secret key never reaches the browser.
2. No free text about sexual behavior on the server; coach chats never stored; no message text in logs.
3. 18+ only; date of birth checked once, never stored.
4. No health claims in UI copy; articles need a grade, sources and a reviewer.
5. AI output validated, filtered, fails safe; crisis numbers from config, never the model.
6. Ads only on allowlisted placements, non-personalized, none for Pro, never between a person and Go a round.
7. Honest boards: server dates, shields never cover resets, clients never set streak values, no one sees others' reset reasons or times.
8. Safety is never paywalled (Kitbag, Bag, reset, crisis resources, export, deletion).
9. Design tokens only; no SF Pro, no SF Symbols, no AI imagery; reduced motion, AA contrast, 44pt targets.
10. Discreet by default in notifications, emails, manifest and titles.
11. No new third-party scripts under /app; no session replay.
12. Read current docs before using a library; ask before adding dependencies.
13. War Chest money is server-only and never WillWar's; offer once; no money between users; stake mode off until legal sign-off.
