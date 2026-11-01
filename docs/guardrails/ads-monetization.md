# Guardrail: ads and monetization

## Principles

1. **Never monetize the urge moment.** No ad, paywall, upsell or sign-up wall sits between a person and Ride it out, or inside a game.
2. **Interactive and opt-in beats intrusive.** The best ad unit here is one the user chooses: watch a short ad, earn a streak shield.
3. **Context, not profiling.** Ads are non-personalized. Inferring "this person is struggling with a sexual habit" and selling that to ad networks is exactly the trust WillWar exists to keep.
4. **Free core, hard-locked Pro.** The free tier carries the network effect (friends must be able to join pacts free). Pro features are fully locked, with no metered trials.
5. **Safety is never for sale.** Ride it out (Drift, Swell), reset, crisis resources, data export and account deletion are free forever.
6. **The War Chest is not revenue.** Forfeits go to causes, never to WillWar; it's available on Free and Pro alike; it never appears next to an ad or on the paywall, and Pro is never sold with it. See `war-chest.md`.

## Placement allowlist

| Placement key | Route | Format | Cap | Tier |
|---|---|---|---|---|
| `rewarded_shield` | `/app/urge/done` (only when the after-score is below 8), `/app/me` shields cell | Rewarded (user taps "Watch a short ad") | 3 views a day; max 2 shields a week from ads | Free |
| `post_game` | `/app/urge/done`, after the summary renders and only when the user taps "Play another round" | Interstitial at a natural break | 1 per app session | Free |
| `learn_feed` | `/learn`, `/app/learn` | In-feed card labeled "Sponsored", every 6th item | — | Free |
| `learn_article_end` | `/learn/[slug]`, after sources | In-article unit or house ad | 1 per article | Free |

**Forbidden everywhere else**, explicitly including: landing page, onboarding, `/app/today`, `/app/urge` before or during a game, the reset sheet and after-reset state, Pact screens, Me stats, Settings, paywall, `/app/war-chest` and every War Chest sheet, support and legal pages. When the after-score is 8 or more, the done screen shows support options, never an ad.

`AdSlot` enforces the allowlist in code (placement → allowed route patterns), and a Playwright test crawls every route as a free user to prove no ad scripts or iframes load elsewhere.

## Providers and rollout

| Stage | `ADS_MODE` | What runs |
|---|---|---|
| Launch (now) | `house` | House ads from `content/sponsors.json`: Pro upsell, and direct sponsors sold by the founder |
| After AdSense approval | `adsense` | AdSense in-feed and in-article units on Learn placements only |
| After H5 Games Ads beta approval | `h5` | Ad Placement API: `adBreak({type: 'next'})` before a second round; rewarded via `adBreak({type: 'reward', beforeReward, adViewed, adDismissed})` |

AdSense site review and the H5 Games Ads beta both require approval and can take a while, so plan November revenue around Pro and direct sponsors. Use `data-adbreak-test="on"` until approved.

Rewarded flow: show "Watch a short ad to earn a streak shield" → on `beforeReward`, show the button → on `adViewed`, call `/api/rewards/shield` → the server grants a shield within the weekly cap. Client callbacks can be faked, so the cap in the database is the real control. `adDismissed` grants nothing and shows nothing guilt-inducing.

## Ad settings

- Non-personalized requests on every unit.
- Blocked categories (AdSense blocking controls and sponsor policy): dating and personals, sexual and reproductive health, adult, gambling and betting, alcohol, testosterone boosters and "male enhancement", supplements making body claims, get-rich-quick and crypto trading, weight-loss drugs.
- No ads that imitate app UI, articles or notifications.
- No incentivized clicks. Rewards are for viewing, never clicking. Never write "click the ad".
- CSP: Google ad domains added only on routes in the allowlist.
- If EU or UK users are served ads, use a Google-certified consent management platform first.

## Policy compliance

Google's publisher policies prohibit graphic sexual content (including descriptions of masturbation) and harmful health claims that contradict scientific consensus; content offering sexual-performance advice is restricted to fewer advertisers. WillWar's clinical, non-graphic, evidence-graded content keeps Learn eligible. Any copy change on ad-bearing pages goes through `content:check`.

## Direct sponsors

A "season sponsor" slot (house ad format) sold for November: fitness, sleep, journaling, books, cold-plunge or outdoor brands. Same blocked categories. Sponsors get aggregate reach numbers only, never user data.

## Pro

| Free | Pro |
|---|---|
| Streak clock, check-ins, calendar | Everything in Free |
| One morning line a day | Up to 3 regenerations a day |
| Ride it out: Drift and Swell | Knots and future games |
| Own 1 pact (up to 5 people); join any number | Unlimited pacts, up to 50 people each |
| View challenges | Create challenges |
| — | Coach ("Talk it through") |
| — | Trigger insights from reset tags |
| Shields from rewarded ads (max 2 a week) | 2 shields a month included |
| On-device journal | Encrypted journal backup |
| — | Tide themes (Dawn, Glacier) |
| Ads on allowlisted placements | No ads |

### Pricing hypotheses (test, don't assume)

| Plan | India | International |
|---|---|---|
| Season pass (one-time; until the season ends, or 30 days for rolling users) | ₹149 | $3.99 |
| Annual (subscription) | ₹799 | $24.99 |

Experiments: season-pass-first vs annual-first ordering; price points ±30%; paywall at end of onboarding vs after the first wave ridden. One experiment at a time, with at least a week of data per arm.

## Paywall rules

- "Continue with Free" is as visible as "Get Pro". No hidden close buttons.
- Prices include taxes and state renewal terms in plain language.
- No fake countdowns, fake scarcity, pre-selected add-ons, or guilt copy ("Don't you want to succeed?").
- Cancel is reachable in two taps from Settings and works without contacting support.
- Entitlements change only from verified Razorpay webhooks.

## Payments

Razorpay: Orders for the season pass; Subscriptions for annual (UPI AutoPay and cards). Webhook signatures verified (HMAC-SHA256 over the raw body, constant-time compare), events made idempotent. Stripe is invite-only for Indian businesses, so it's out of scope unless the company later incorporates abroad.

## Metrics

D1, D7 and D30 retention; daily check-in rate; urge flows started vs "Wave passed"; average intensity drop; invites sent per user and invite acceptance (viral coefficient); paywall views to purchase; refund rate; ad revenue per daily active free user; share-card exports. Review weekly. If ads measurably hurt retention, cut ads first.
