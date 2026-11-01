# Social integrity

Non-negotiable 7: honest boards. Server-derived dates; shields cover missed check-ins only, never resets; clients never set streak values; nobody sees anyone else's reset reasons or times.

## Rules

- No photo uploads. Handles, not names (3–20 lowercase letters, numbers, underscores; profanity and slur filter on handles and camp names).
- No free-text messages between users. Five preset nudges only ("Proud of you", "Go a round. You've got this.", "Get up. Day one counts.", "Almost there", "I'm in your corner"), max 3 per sender per recipient per day, enforced in `send_nudge`.
- Visibility: Only me / My camps (default) / Everyone. Private users never appear on boards.
- Camp members see: handle, locker plate, current streak, best streak in the season, days kept, last check-in date, an optional Backed badge.
- Camp members never see: reset times, tags or counts, War Chest details, urge data, corner talk, subscription status.
- No public "who reset" feed and no reset notifications to friends.
- Report, mute, leave. Owners can remove members and regenerate the invite code.
- Anyone who indicates they're under 18 is suspended and queued for deletion.
- Free camps hold up to 5; Pro camps up to 50. Free users own one camp.

## Board metrics (`camp_leaderboard`)

- **Current:** time since each person's last reset.
- **Best:** longest streak inside the season window (or all time for unlinked camps), computed in each member's timezone.
- **Days:** check-ins marked held or shielded during the season.
- Rows with no check-in for two days show "Paused" in `--text-3`.

Realtime: a private Supabase broadcast channel per camp with Realtime Authorization; the payload is only `{"type":"refresh"}` and clients refetch.
