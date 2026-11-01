# Guardrail: social features and leaderboard integrity

Pacts make WillWar sticky and viral. They also create the product's biggest social risks: shame, pressure, cheating, harassment, and minors. These rules keep pacts supportive and leaderboards meaningful.

## Who can be here

- Adults only. The age gate runs before account creation; under-18s get a kind message and no account. Nothing is stored for them.
- If anyone indicates they are under 18 (support message, coach input, report), the account is suspended and queued for deletion after founder review.
- No photo uploads anywhere. Avatars are generated pebbles. This removes a whole category of moderation risk.
- Handles, not names. Onboarding tells people not to use their real name; handles are 3–20 lowercase letters, numbers or underscores and pass a profanity and slur filter.

## What other people can see

| Visible to pact members | Never visible to anyone else |
|---|---|
| Handle and pebble | Email, timezone, reason tags, tone |
| Current streak (time since last reset) | Reset times, reset tags, how many resets |
| Best streak within the pact's season | Urge sessions and intensities |
| Days kept within the season | Morning lines, coach use, journal |
| Last check-in date (to show "Paused") | Subscription status |
| A "Backed" badge, only if the user turns it on | War Chest amount, rule, cause, forfeits and refunds |

Visibility settings (Settings → Who sees your streak): Only me (excluded from every board), My pacts (default), Everyone (also on the global season board, top 100 plus your own rank).

## Leaderboard definitions

| Board | Definition |
|---|---|
| Current | Seconds since the open streak started. Shown as "Paused" after two days without a check-in. |
| Best | Longest streak overlapping the season window (in each user's own timezone), clipped to the window. Without a season, all-time. |
| Days | Count of check-ins with status held or shielded inside the season window. |

The database computes all three in `pact_leaderboard`; clients only display them.

## Integrity rules (honor system, made hard to game casually)

1. The server decides the date of every check-in from the profile's timezone. Clients never send dates for check-ins.
2. Streak start can be backdated only at onboarding: to the season start (for people who began on 1 November before finding WillWar) or up to 48 hours otherwise. Pacts are told it's on the honor system.
3. Shields cover a missed check-in inside an unbroken streak, within three days. They never cover a reset.
4. Timezone changes are allowed (people travel) but limited to one a week and logged as an event.
5. One open streak per user (database constraint).
6. Leaderboards are friends-first. The global board is opt-in and shows handles only.

## Money between users

None, ever. No group pots, side bets, "loser pays the winner", buy-ins, cash or voucher prizes for leaderboard ranks or challenges, and no way to stake money on someone else's streak. Challenges are for recognition only. This keeps WillWar clear of India's prohibition on online money games and keeps pacts about support. The War Chest is strictly between a user and their chosen cause.

## Nudges and communication

- No free-text direct messages in v1. Nudges are five preset messages: Proud of you; Ride it out, you've got this; Day one counts; Almost there; I'm with you.
- Rate limit: 3 nudges per sender per recipient per day (enforced in the database).
- Recipients can mute a person (stop their nudges) or leave a pact at any time from Settings or the pact screen, with no notification to others beyond the member count.
- Pact names pass the same profanity and slur filter as handles.

## Pressure and shame

- No public "who reset" feed, no reset notifications to friends, no red on anyone's row.
- A reset changes your current number; it never announces itself.
- Copy on pact screens follows the voice rules in DESIGN.md: supportive, never mocking.
- Challenges end with recognition for everyone who took part, not only the winner.

## Reporting and moderation

- Report a handle or pact name from its row (reason list + optional note to the founder; the note is stored in a server-only `reports` table, read by the founder, deleted after resolution).
- Founder reviews reports within 48 hours. Actions: rename (forced), remove from pact, suspend, delete.
- Keep a short moderation log (action, reason, date) without copying user content.

## Owner powers

The pact owner can rename the pact, remove members, and regenerate the invite code. Ownership transfers to the longest-standing member if the owner deletes their account; an empty pact is deleted.
