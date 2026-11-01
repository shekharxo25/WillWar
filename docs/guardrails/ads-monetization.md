# Ads and monetization

Non-negotiables 6 and 8.

## Pricing

| Plan | INR | USD | Notes |
|---|---|---|---|
| Season pass | ₹149 | $3.99 | One-time Razorpay Order; active until the season's last day in the user's timezone, or 30 days for rolling users |
| Annual | ₹799 | $24.99 | Razorpay Subscription (UPI AutoPay) |

Prices include taxes. Free: streak clock, daily check-in, corner talk, Kitbag and Bag, one camp of up to five, all articles, ads. Pro adds: Combos, the coach, unlimited camps up to 50, custom challenges, trigger insights, two streak shields a month, journal backup, clock skins, no ads.

## Paywall rules

- Hard paywall on Pro features only. **Safety is never paywalled:** Go a round (Kitbag and Bag), reset, crisis resources, export and deletion are free.
- "Continue with Free" is as clear as "Get Pro". No fake timers, no countdowns, no pre-selected upsells. Renewal terms shown; restore by signing in.
- Entitlements change only from the verified Razorpay webhook (HMAC-SHA256 of the raw body, constant-time compare, idempotency through `webhook_events`). Pro checks live in RPCs and route handlers, never only in the UI.
- No Pro upsell on any War Chest screen.

## Ad placement allowlist

| Placement | Route | Format | Cap |
|---|---|---|---|
| `rewarded_shield` | `/app/round/done` (only when the after-score is below 8), Me shields cell | Rewarded, opt-in ("Watch a short ad") | 3 views a day; max 2 shields a week |
| `post_round` | `/app/round/done`, only when the user taps "Go another round" | Interstitial at a natural break | 1 per session |
| `learn_feed` | `/learn`, `/app/learn` | In-feed card labeled "Sponsored", every 6th item | — |
| `learn_article_end` | `/learn/[slug]`, after sources | In-article unit or house ad | 1 per article |

**Forbidden everywhere else**, including the landing page, onboarding, Today, the round flow before and during a game, reset, Camp, Me stats, Settings, the paywall, every War Chest screen, support and legal pages.

**Blocked categories:** dating, sexual and reproductive health, adult, gambling, alcohol, testosterone boosters and "male enhancement", supplements with body claims, get-rich-quick and crypto trading, weight-loss drugs.

Ads are non-personalized. Pro renders nothing. Scripts load only on allowlisted routes; the CSP for those routes adds only the Google domains needed. AdSense and the H5 Games Ads beta need approval, so launch with house ads and direct sponsors (`NEXT_PUBLIC_ADS_MODE=house`). A Playwright test crawls every route as a free user and fails if an ad script or iframe appears outside the allowlist.
