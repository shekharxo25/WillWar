# Guardrail: War Chest (the money commitment)

## What it is

An optional commitment device. After a user has signed a free pledge and held their first day, WillWar offers once to let them put an amount of their own money behind the challenge.

- **Steady (default):** each reset sends 25% of the original amount to a cause the user picked.
- **Strict:** the first reset sends all of it.
- Whatever is left comes back to the user's original payment method the day after the challenge ends.
- WillWar never keeps any forfeited money. Forfeits are donated monthly with receipts published at `/war-chest/report`.

It is a promise to yourself with something on it. It is not a bet, a game, a prize or a revenue line.

## Why it works, and how much

**Foot in the door.** Freedman and Fraser (1966) showed that people who first agree to a small request are more likely to agree to a larger related one. Later meta-analyses confirm the effect is real but small, and it depends on details:

- Actually performing the small act matters more than merely agreeing to it. → The pledge is a physical act (hold to sign for 3 seconds), not a checkbox.
- People who refuse the small request become *less* likely to agree to the larger one. → Users who skip the pledge are never offered the War Chest.
- A gap of days between requests tends to help, and attaching external rewards to the first request weakens the effect. → The pledge comes at onboarding with no incentive attached; the War Chest comes after the first held day.

**Commitment contracts.** In a field trial in the Philippines (Giné, Karlan and Zinman, 2010), smokers could deposit their own money for six months; if they passed a nicotine test it was returned, otherwise it went to charity. About 11% of those offered signed up, and those offered the contract were 3.3 to 5.8 percentage points more likely to pass the test, an effect that held at 12 months. Two important caveats: about two-thirds of the people who committed still failed to quit, and that study verified outcomes with a urine test. WillWar runs on the honor system, which is weaker.

**Set expectations accordingly:** a modest boost for the minority who opt in. Not a growth engine and not a reason to push harder.

**Why Steady is the default.** Relapse-prevention research describes the abstinence violation effect: after one slip, "I've already blown it" thinking turns a slip into a binge. An all-or-nothing stake makes that worse, because once the money is gone there's nothing left to protect. With Steady, something is always still worth keeping.

## The sequence

1. **Onboarding:** "Make it official." The user holds to sign a pledge that includes their end date and first reason. Skip is allowed and equally legible.
2. **First held day:** after the "Day 1 held." HUD settles, if `war_chest_offer_eligible()` is true, show the offer sheet once and call `mark_war_chest_offered()`.
3. **Setup:** amount → rule → cause → review → pay (stake mode) or promise (promise mode).
4. **During the challenge:** the chest card on Today and Me; each reset shows the forfeit line.
5. **End:** the day after the end date, the remainder is refunded and the Day 30 screen says so.

## Modes and the legal gate

| Mode | What happens | When |
|---|---|---|
| `off` | Nothing renders | Any market where neither mode is cleared |
| `promise` | No money moves. The user names an amount and a cause; on reset they see their share and a link to donate it themselves. Nothing is tracked about whether they do. | Launch default |
| `stake` | Real money via Razorpay, held until the end date, refunded minus forfeits | Only after every item in the sign-off checklist below is done, India first |

### Sign-off checklist for stake mode (all required, founder confirms in writing)

- [ ] **Indian counsel's written opinion** covering at least:
  - the Promotion and Regulation of Online Gaming Act, 2025, which prohibits online money games, defined around paying or depositing money in expectation of monetary or other enrichment. The War Chest returns only the user's own money and isn't a game, but counsel must confirm it is outside the definition and that nothing in the product (games, leaderboards, pacts) could be read as linking money to winning;
  - whether holding refundable money for up to 90 days is a "deposit" under the Banning of Unregulated Deposit Schemes Act, 2019, and which exemption applies;
  - whether collecting money and paying forfeits to third-party charities requires an escrow arrangement or payment-aggregator licensing under RBI rules;
  - state gambling and wagering laws;
  - Consumer Protection (E-Commerce) Rules disclosures for refunds and cancellation;
  - GST and income-tax treatment of forfeits passed to charity.
- [ ] **Razorpay's written approval** of the use case, described plainly as a commitment contract with refunds and charity forfeits. Payment systems are barred from processing payments for online money games, so a vague description risks the whole merchant account.
- [ ] **Charity agreements** for every cause in the `causes` table, and a published monthly donation process. Users are told they won't receive tax receipts for forfeits.
- [ ] **Terms of service** section for the War Chest, reviewed by counsel.
- [ ] **Refund operations tested** in Razorpay test mode end to end, including failed refunds and the 6-month limit (staked challenges are capped at 90 days).
- [ ] Outside India, stake mode stays off until local review. Promise mode can run everywhere.

## Rules (hard)

1. **One offer, ever.** Shown at most once per account, only from the first-held-day trigger. Never re-prompted, never sent by push, email or ad. Users can still set one up themselves from Me.
2. **Never at a vulnerable moment.** Not inside Ride it out, not between 23:00 and 06:00 local, not within 7 days of a crisis card, not on the paywall, not next to an ad.
3. **No pre-selected amount.** Continue stays disabled until the user picks. "Not now" is as visible as the primary button.
4. **Caps.** INR 49–5,000; USD 2–100. One War Chest per challenge. Staked challenges between 7 and 90 days long.
5. **WillWar never keeps forfeits.** All forfeited money goes to the chosen cause. Payment processing costs are absorbed by WillWar, not taken from the user's refund. If this is ever reconsidered, it needs a new legal review because it changes the incentives (the company would profit when users slip).
6. **No money between users. Ever.** No pots, side bets, "loser pays", group stakes, cash prizes, or anything that ties money to leaderboard rank, pact results or game scores. This is both a legal line (online money games) and a trust line.
7. **The War Chest never touches games or boards.** It doesn't change scores, ranks, shields or Pro status.
8. **Honor system, stated plainly.** "Nobody can check this but you." Resets are never second-guessed.
9. **Release valves.**
   - Cancel within 24 hours of paying for a full refund of what's left.
   - Hardship: support returns what's left at any time, no questions, no forfeits.
   - Crisis: when a crisis card is shown to someone with an active stake, offer the release in one line.
   - Account deletion refunds what's left before deleting anything.
10. **Private by default.** Amount, cause and history are visible only to the owner. The optional Backed badge shows that a War Chest exists, never how much.
11. **Copy without shame.** "₹125 goes to [cause]. ₹375 is still yours if you keep going." Never "lost", "penalty", "fine", "wasted", "you failed". No coin animations, no red.
12. **AI stays out of it.** Morning lines and the coach never mention the War Chest or money.
13. **Server-side money only.** Only the server (secret key) can create, activate, refund or settle a stake. The client can read its own chest and call `create_promise_chest` and `cancel_war_chest`. CI checks that the money functions aren't executable by `anon` or `authenticated`.

## Copy reference

| Moment | Copy |
|---|---|
| Pledge | "Until Mon 30 November, I'll ride out the urge instead of giving in. I'm doing it for focus." → Hold to sign → "Pledge signed." |
| Offer | "Back your pledge?" / "Put an amount behind it. Each reset sends a quarter to a cause you pick. Make it to Mon 30 November and whatever's left comes back to you." / "WillWar never keeps any of it." |
| Amount helper | "Pick an amount you'd notice, not one that would hurt." |
| Review | "Honor system. Nobody can check this but you." / "Changed your mind? Cancel within 24 hours for a full refund." / "Money tight later? Contact support and we'll return what's left." |
| Confirmed | "War Chest set: ₹499." |
| Reset (Steady) | "₹125 goes to [cause]. ₹375 is still yours if you keep going." |
| Reset (Strict) | "Your ₹499 goes to [cause]." |
| Reset (promise) | "You promised ₹125 to [cause] for this reset." + "Donate now" |
| End | "₹375 is on its way back to you. It usually reaches your account in 5–7 working days." / "₹125 went to [cause]. Thank you." |
| Crisis release | "Your War Chest can wait. Want your money back now?" |

## Metrics and kill criteria

Track: offer acceptance rate; completion rate for users with and without a War Chest (a comparison, not proof of cause, because people who opt in differ); average amount; hardship and crisis releases; refund failures; support complaints.

Watch for hidden resets. If people with a stake report far fewer resets than similar users without one, some may be hiding resets to protect their money. That corrupts leaderboards and the user's own data. The War Chest doesn't touch boards, but if the gap is large, add a gentle reminder at reset that forfeits go to a cause they chose, and review the feature.

Turn the feature off (flag to `off`) if any of these happen: a regulator, payment provider or counsel raises a concern; refund failures exceed 1% in a month; hardship releases or complaints suggest the stakes are causing harm; or a user reports being pressured by another user about money.
