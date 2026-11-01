# Copilot instructions — WillWar

Read `AGENTS.md` at the repo root first; it holds the non-negotiables, commands and repo map. Then read the guardrail in `docs/guardrails/` for the area you're changing, and `docs/design/DESIGN.md` for any UI.

The short version, in case only this file is loaded:

1. Every table in `public` has RLS. Sensitive writes go through `security definer` RPCs with `set search_path = ''`. The Supabase secret key is server-only.
2. No free text about sexual behavior is stored server-side. Reset reasons are fixed tags; coach chats aren't persisted.
3. 18+ only; the date of birth is checked once and never stored.
4. No health claims in UI copy. Articles need an evidence grade, sources and a reviewer.
5. AI output is schema-validated and filtered; crisis resources come from config, never the model.
6. Ads only on allowlisted placements, non-personalized, never before or during Ride it out. Pro sees none.
7. Server derives dates; shields cover missed check-ins only; clients never set streak values.
8. Ride it out, reset, crisis resources, export and deletion are never paywalled.
9. Tokens from DESIGN.md only. No SF Pro files, no SF Symbols. Phosphor icons. Reduced motion, AA contrast, 44pt targets.
10. Discreet notification and email copy by default.
11. No new third-party scripts under `/app`; no session replay.
12. Check current docs before using a library API; ask before adding dependencies.
13. War Chest: money functions are server-only; forfeits go to the user's cause, never to WillWar; offer shown once, never at vulnerable moments; no pre-selected amounts; no money between users. See `docs/guardrails/war-chest.md`.
