# War Chest

Non-negotiable 13: War Chest money is server-only and never WillWar's. Offer once, never at vulnerable moments, nothing pre-selected, no money between users ever, stake mode off until legal sign-off.

Flag: `NEXT_PUBLIC_WAR_CHEST_MODE` = `off` | `promise` (default) | `stake`. **Never set `stake` until every box below is ticked.**

## Rules

1. **One offer, ever.** Shown at most once per account, only from the first-held-day trigger. Never re-prompted, never sent by push, email or ad. Users can still set one up from Me.
2. **Never at a vulnerable moment.** Not inside Go a round, not between 23:00 and 06:00 local, not within 7 days of a crisis card, not on the paywall, not next to an ad.
3. **No pre-selected amount.** Continue stays disabled until the user picks. "Not now" is as visible as the primary button.
4. **Caps.** INR 49–5,000; USD 2–100. One War Chest per challenge. Staked challenges between 7 and 90 days (normal Razorpay refunds fail after 6 months).
5. **WillWar never keeps forfeits.** All forfeited money goes to the chosen cause. Processing costs are absorbed by WillWar, not taken from refunds. Reconsidering this needs a new legal review (the company would profit when users slip).
6. **No money between users. Ever.** No pots, side bets, "loser pays", group stakes, cash prizes, or anything tying money to rank, camp results or game scores.
7. **The War Chest never touches games or boards.** It doesn't change scores, ranks, shields or Pro status.
8. **Honor system, stated plainly.** "Nobody can check this but you." Resets are never second-guessed.
9. **Release valves.** Cancel within 24 hours of paying for a full refund of what's left. Hardship: support returns what's left at any time, no questions. Crisis: offer the release in one line. Account deletion refunds what's left before deleting anything.
10. **Private by default.** Amount, cause and history are visible only to the owner. The optional Backed badge shows that a War Chest exists, never how much.
11. **Copy without shame.** "₹125 goes to [cause]. ₹375 is still yours if you keep going." Never "lost", "penalty", "fine", "wasted", "you failed". No coin animations, no red.
12. **AI stays out of it.** Corner talk and the coach never mention the War Chest or money.
13. **Server-side money only.** Only the server (secret key) can create, activate, refund or settle a stake. The client can read its own chest and call `create_promise_chest` and `cancel_war_chest`. CI checks the money functions aren't executable by `anon` or `authenticated`.

## Forfeit math

- Steady (recommended): each reset sends 25% of the original amount (integer division), never more than what's left.
- Strict: the first reset sends everything left.
- Refund at the end = amount − forfeited. `record_refund` rejects any other amount.

## Legal sign-off before stake mode

- [ ] Indian counsel's written opinion covering at least:
  - the Promotion and Regulation of Online Gaming Act, 2025 (online money games): confirm the War Chest is outside the definition and nothing in the product (games, leaderboards, camps) links money to winning;
  - whether holding refundable money for up to 90 days is a "deposit" under the Banning of Unregulated Deposit Schemes Act, 2019, and which exemption applies;
  - whether collecting money and paying forfeits to charities requires escrow or payment-aggregator licensing under RBI rules;
  - state gambling and wagering laws;
  - Consumer Protection (E-Commerce) Rules disclosures for refunds and cancellation;
  - GST and income-tax treatment of forfeits passed to charity.
- [ ] Razorpay's written approval of the use case, described plainly as a commitment contract with refunds and charity forfeits.
- [ ] Charity agreements for every cause in the `causes` table, and a published monthly donation process. Users told they won't receive tax receipts for forfeits.
- [ ] Terms of service War Chest section, reviewed by counsel.
- [ ] Refund operations tested in Razorpay test mode end to end, including failed refunds and the 6-month limit.
- [ ] Outside India, stake mode stays off until local review. Promise mode can run everywhere.
