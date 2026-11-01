-- Seed data. The nnn-2026 season is inserted by the core migration.

-- Causes must be vetted by the founder (docs/guardrails/war-chest.md). These placeholders
-- match src/lib/domain/constants.ts and must be replaced before launch.
insert into public.causes (id, name, country, url) values
  ('placeholder-in-mental-health', '[Cause name pending founder review]', 'IN', 'https://example.org/'),
  ('placeholder-global-water', '[Cause name pending founder review]', 'GLOBAL', 'https://example.org/')
on conflict (id) do nothing;

-- Handle and pact-name filter (substring match). Keep short; extend from moderation reports.
insert into public.blocked_terms (term) values
  ('admin'), ('willwar'), ('support'), ('moderator'), ('fuck'), ('shit'), ('cunt'), ('nigger'), ('faggot'), ('retard'),
  ('porn'), ('nude'), ('sexy'), ('slut'), ('whore')
on conflict do nothing;
