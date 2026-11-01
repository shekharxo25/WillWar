# WillWar — DESIGN.md

The brand contract for every WillWar surface: landing page, PWA, share cards, emails. It follows Apple's current design language (iOS 26, Liquid Glass) translated to the web with assets that are legal to ship. Every color, type size, spacing value, radius and motion curve in a design or in code comes from this file.

Product: a No Nut November and 30-day reset tracker for adults (18+). Name: WillWar.

---

## 1. Visual theme and atmosphere

Calm, native, adult. WillWar should feel like an Apple first-party utility (Fitness, Health, Journal) that happens to be about holding a line for thirty days.

The name carries the fight; the visuals stay calm. The war is an internal one, won by riding out urges rather than fighting them head-on, so the visual world is water at night turning toward dawn: a tide, a wave that crests and falls, a steady horizon. One living element carries the brand: **the Tide**, a water level that rises as the streak grows. Everything around it stays quiet and disciplined.

WillWar is the opposite of gym-bro hype. No weapons, soldiers, helmets, camouflage, blood or military insignia. No flames, lightning, skulls, crowns, "alpha" imagery, neon on black, or hustle gradients. No bodies, no people photography, no women, nothing suggestive. Imagery is abstract water only.

## 2. Color palette and roles

Apple semantic surfaces plus two brand colors. Tide is the only interactive color. Brass is reserved for milestones.

### Light

| Token | Value | Role |
|---|---|---|
| `--bg-grouped` | `#F2F2F7` | Screen background behind grouped lists |
| `--bg` | `#FFFFFF` | Cells, cards, sheets |
| `--bg-tertiary` | `#E5E5EA` | Pressed cells, tracks, inactive segments |
| `--label` | `#000000` | Primary text |
| `--label-2` | `rgba(60,60,67,0.60)` | Secondary text |
| `--label-3` | `rgba(60,60,67,0.30)` | Placeholder, disabled |
| `--separator` | `rgba(60,60,67,0.29)` | 0.5px hairlines |
| `--tide` | `#0B6E7F` | Tint: buttons, links, selected tab, the water. 5.9:1 on white |
| `--tide-deep` | `#0A3F55` | Lower water layer, shadow tint |
| `--tide-wash` | `rgba(11,110,127,0.08)` | Secondary button fill, "my row" highlight |
| `--brass` | `#B8862B` | Milestone medals, best-streak marker. Graphics only on light (3.2:1) |
| `--brass-ink` | `#8A6114` | Brass-colored text on light (passes 4.5:1) |
| `--destructive` | `#FF3B30` | Reset streak, delete account. Nothing else |

### Dark

| Token | Value | Role |
|---|---|---|
| `--bg-grouped` | `#000000` | True black grouped background (iOS dark, OLED) |
| `--bg` | `#1C1C1E` | Cells, cards |
| `--bg-tertiary` | `#2C2C2E` | Pressed cells, tracks, sheets over cards |
| `--label` | `#FFFFFF` | |
| `--label-2` | `rgba(235,235,245,0.60)` | |
| `--label-3` | `rgba(235,235,245,0.30)` | |
| `--separator` | `rgba(84,84,88,0.65)` | |
| `--tide` | `#3FB6C9` | 8.6:1 on black |
| `--tide-deep` | `#0E5566` | Lower water layer |
| `--tide-wash` | `rgba(63,182,201,0.14)` | |
| `--brass` | `#D9A441` | |
| `--brass-ink` | `#D9A441` | |
| `--destructive` | `#FF453A` | |

The app follows the system appearance. Settings offers System, Light and Dark.

### Proportions

60% grouped surfaces, 30% labels, 10% Tide. Brass covers under 2% of any screen and appears only at milestones (Day 7, 14, 21, 30, and a new best streak). Brass on a screen without a milestone is a bug.

### The water gradient

`--tide` at 90% opacity at the surface, fading to `--tide-deep` at the floor. This gradient exists only inside the Tide component and the app icon. Nowhere else.

### Pro tide themes (cosmetic, Pro only)

Harbor (default, the tokens above), Dawn (`#C8644A` → `#5B2A3A`), Glacier (`#5E8FB8` → `#1F3550`). Themes change only the water. Interface tint stays Tide.

## 3. Typography

### Families

- **Interface and text:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. On Apple devices this renders SF Pro without shipping the font. Never self-host, embed or link SF Pro files: Apple's license limits them to mock-ups for Apple-platform software.
- **Numerals (clock, counts, ranks):** `ui-rounded, "WillWar Digits", system-ui` with `font-variant-numeric: tabular-nums`. Safari renders SF Pro Rounded through `ui-rounded`. "WillWar Digits" is a self-hosted subset of Nunito (SIL Open Font License) containing digits, colon, "d h m s" and space, used by other browsers.
- **Wordmark:** "WillWar" is drawn once as SVG outlines from a face licensed for logo use (research candidates on fontinlogo.com). The wordmark is never live text.

### App scale (iOS Dynamic Type, Large default)

| Style | Size / line | Weight | Use |
|---|---|---|---|
| Clock | 64 / 64, rounded | 600 | The Tide timer |
| Large title | 34 / 41 | 700 | Screen titles |
| Title 2 | 22 / 28 | 700 | Sheet titles |
| Headline | 17 / 22 | 600 | Cell titles, buttons |
| Body | 17 / 22 | 400 | Text |
| Subheadline | 15 / 20 | 400 | Supporting text |
| Footnote | 13 / 18 | 400 | Timestamps, legal, captions |
| Tab label | 11 / 13 | 500 | Tab bar only |

Per screen: at most four sizes and two weights (400 and 600). 700 appears only in large titles. Input text is never smaller than 16px, so iOS doesn't zoom.

### Landing scale

| Style | Value |
|---|---|
| Hero H1 | `clamp(44px, 7vw, 88px)` / 1.04, 700, letter-spacing -0.025em |
| H2 | `clamp(32px, 4.5vw, 56px)` / 1.08, 700, -0.02em |
| Lead | 21 / 30, 400 |
| Body | 17 / 26, 400 |
| Hero clock | `clamp(56px, 12vw, 128px)`, rounded 600, tabular |
| Footnote | 13 / 18 |

Line length stays under 68 characters; the body column is at most 680px wide.

### Rules

Sentence case everywhere. No all-caps labels, no letter-spaced eyebrows above headings, no single accented word inside a headline. Values outrank labels: "12 days" is large, "Current streak" is small.

## 4. Component stylings

### Glass material (Liquid Glass, web version)

Used only for floating chrome: tab bar, navigation bar after scroll, the Ride it out pill, sheet grabbers, HUD toasts. Never on content cards.

```css
.glass {
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border: 0.5px solid rgb(255 255 255 / 0.18);
  box-shadow: inset 0 0.5px 0 rgb(255 255 255 / 0.35), 0 8px 24px rgb(10 63 85 / 0.12);
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--bg); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

No SVG displacement or refraction filters. Safari doesn't support them and they cost frames on mid-range Android.

### Navigation bar

Large title (34pt) at rest, collapsing to a centered 17pt inline title on scroll. Transparent at rest; glass with a hairline once content scrolls under it. Trailing buttons are 44×44 circular glass buttons with a single icon.

### Tab bar

A floating glass capsule, 16pt from the screen edges, sitting above the home indicator. Four tabs: Today, Pact, Learn, Me. Icons 24pt, regular weight when unselected and fill weight when selected, in `--tide`. Labels are the 11pt tab style. Hide on scroll down inside long readers; show on scroll up.

### Ride it out pill

The one persistent action, and the only deliberate break from Apple's rule that tab bars are for navigation. It sits 12pt above the tab bar on Today, Pact and Learn: a capsule 52pt tall, `--tide` fill, white 17pt semibold label "Ride it out" with a wave icon. On scroll it compresses to a 52pt circle holding only the icon. It is never hidden behind a paywall, an ad or a sheet.

### Buttons

| Variant | Spec |
|---|---|
| Primary | `--tide` fill, white 17/600 label, height 50, radius 14, full width in sheets |
| Secondary | `--tide-wash` fill, `--tide` label, same metrics |
| Plain | `--tide` label, no fill, 44pt hit area |
| Destructive | `--destructive` label (plain) inside confirmation sheets only |

Pressed state: scale 0.97 and opacity 0.85 over 120ms. Disabled: `--label-3` label, `--bg-tertiary` fill. Labels say exactly what happens ("Reset streak", never "Submit" or "OK").

### Inset grouped lists

Cells on `--bg`, grouped on `--bg-grouped`, radius 12, horizontal inset 16, cell height at least 44 (52 with subtitle), 16pt internal horizontal padding, 0.5px separators inset to the text start. Section headers are 13pt sentence case in `--label-2`, never uppercase.

### Cards

Radius 16, padding 20, `--bg` fill, no border, no shadow. Feature cards (the affirmation, a challenge) may use radius 22 and 24 padding. Nested radii are concentric: inner radius = outer radius − padding.

### Sheets

Bottom sheets with a 36×5 grabber, medium and large detents, drag to dismiss, 40% dim behind. Top corner radius 22. Title 22/700, left aligned. Destructive confirmations are sheets, not alerts, so the consequence can be explained in a sentence.

### HUD toast

A glass capsule at the top center below the status bar, icon plus one line, auto-dismiss after 2.4s, swipe up to dismiss. Used for "Day 12 held." and "Wave passed."

### Segmented control

`--bg-tertiary` track, white (dark: `#636366`) thumb with a soft shadow, 32pt tall, 13pt 600 labels. Used for leaderboard metrics: Current, Best, Days.

### Intensity scale (1–10)

Two rows of five 52pt circles. Selected: `--tide` fill, white numeral. Labels at the ends only: "Barely there" under 1, "Overwhelming" under 10. "Skip" is a plain button. No sliders here; a tap is faster and works one-handed.

### Selection chips

Height 36, radius 18, 15pt label with a 16pt icon. Unselected `--bg` with a hairline; selected `--tide-wash` fill and a `--tide` label. Multi-select shows a maximum ("Pick up to 3").

### Leaderboard row

52pt: rank (tabular, `--label-2`), avatar pebble 32pt, handle 17/400, and the value right-aligned as a 17/600 number with a 13pt unit ("12 d"). My row has a `--tide-wash` background. Stale rows (no check-in for two days) show the value in `--label-3` with "Paused".

### Avatar pebbles

Generated from `avatar_seed`: a soft irregular pebble shape with two tones from the active water theme. No photo uploads anywhere in the product.

### The Tide (signature)

A full-width card on Today, 320pt tall, radius 22.

- Water level = elapsed ÷ goal (30 days, or the season's end). Two sine layers drift at different speeds (cycles of 9s and 13s), front layer `--tide`, back layer `--tide-deep`.
- The clock sits over the water: `12d 04h 31m 08s`, Clock style, white when the water is behind it and `--label` above the waterline (switch with `mix-blend-mode` or two clipped copies).
- Milestone ticks on the right edge at days 7, 14, 21 and 30. Passed ticks turn `--brass`.
- Under the clock, one Footnote line: "Started Sun 1 Nov, 00:00" or "Best: 19 days".
- Tapping Ride it out expands the Tide into full-screen Urge mode (shared-element transition).
- The waves pause when the page is hidden and settle to a still surface after 20 seconds without touch. They resume on interaction.

### Evidence chip (Learn)

| Grade | Style |
|---|---|
| Strong | `--tide` fill, white label |
| Moderate | `--tide-wash` fill, `--tide` label |
| Mixed | `--bg-tertiary` fill, `--label-2` label |
| Myth | `--bg` with hairline, `--label-2` label, strike-through icon |

### Sponsored card

Same footprint as an article card, with "Sponsored" in Footnote `--label-2` at the top left and a neutral hairline border. Never uses Tide color, never imitates an article title style.

### Inputs

Height 52, radius 12, `--bg` fill on grouped background, 17pt text, 16pt minimum. Errors appear below in Footnote with `--destructive` text and say how to fix it ("Use 3–20 letters, numbers or underscores").

### Wheel picker

Date of birth and "I already started" use an iOS-style wheel, one-time entry only.

### Pledge signature (onboarding, the free first commitment)

The pledge text in Title 2 (left aligned, three short lines that include the user's end date and first reason), then a 64pt-tall capsule button "Hold to sign". Holding fills the capsule with `--tide` over 3 seconds; releasing early drains it. On completion the user's handle is written beneath the pledge in the numerals face at 22pt, with a HUD "Pledge signed." A plain "Skip" sits under the button with equal legibility. Keyboard: hold Space.

### War Chest

The optional money commitment, offered once. Components:

- **Offer sheet:** medium-detent sheet, Title 2 headline, two short paragraphs, primary "Set up my War Chest", plain "Not now" at equal width beneath it, Footnote "We'll only ask once. You'll find it in Me if you change your mind."
- **Amount chips:** ₹99, ₹199, ₹499, ₹999 and Custom (US: $2, $5, $10, $20, Custom). Nothing is pre-selected. Helper line: "Pick an amount you'd notice, not one that would hurt."
- **Rule cells:** two selectable inset cells, Steady (default, marked "Recommended") and Strict, each with a one-line explanation.
- **Cause list:** inset grouped cells with name, one-line description and an outbound link icon.
- **Chest card:** radius 16 card with the amount in the numerals face, and a two-part bar: the part still yours in `--tide`, the part given to the cause in `--label-3` with a small heart icon. Never red, never "lost". Under it: "Comes back on Tue 1 Dec" and the cause name.
- **Backed badge:** a 16pt vault icon after a handle on leaderboards, shown only if the user opts in. Never an amount.

War Chest surfaces never use brass (brass stays for milestones) and never appear inside Ride it out, beside ads, or on the paywall.

### Empty states

An abstract water illustration (the line of a calm sea), one sentence that explains, one primary action. Example: "No pact yet. Pacts are small groups of friends who see each other's streaks." → "Start a pact".

## 5. Layout principles

### Grid and spacing

8-point grid; 4-point steps allowed for fine adjustments. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Related items sit 8–12 apart; groups sit 24–32 apart (twice the inner gap).

### App

Screen margins 16 (20 on screens 414pt and wider). Primary actions live in the bottom third: Ride it out, I held today, sheet buttons. The app column is capped at 480px; wider screens show it centered over a still, full-bleed water background.

```
Today (iPhone 15, 393×852)
┌───────────────────────────────┐
│ status bar (safe area)        │
│ Today                    (◎)  │  large title, avatar → Me
│ ┌───────────────────────────┐ │
│ │      12d 04h 31m 08s      │ │  the Tide, 320pt
│ │  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  │─┤  ticks: 7 (brass), 14, 21, 30
│ │ ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈ │ │
│ └───────────────────────────┘ │
│ [        I held today       ] │  primary; becomes "Day 12 held"
│ ┌ Morning line ─────────────┐ │
│ │ Day 12. You've handled... │ │  affirmation card
│ └───────────────────────────┘ │
│  Pact · 3 of 4 checked in   › │  inset grouped cells
│  Streak shields           1 › │
│  War Chest  ₹375 yours      › │  only if the user set one up
│                               │
│ (≋  Ride it out             ) │  persistent pill
│ ( Today  Pact  Learn   Me   ) │  floating glass tab bar
└───────────────────────────────┘
```

### Landing

12-column grid, max width 1120, gutters 24; text column 680. Left-aligned text on desktop; centered only in the hero. Section vertical padding 96 desktop, 64 mobile; the 30-day scroll sequence gets 300vh of scroll length.

```
Landing hero (desktop)
┌──────────────────────────────────────────────────────────┐
│ WillWar                                          Sign in    │
│                                                          │
│   Make it to December.                  ┌──────────┐     │
│   A streak clock that counts every      │  iPhone  │     │
│   second, a three-minute game for       │  showing │     │
│   when the urge hits, and a private     │ the Tide │     │
│   leaderboard with friends you trust.   │          │     │
│                                         └──────────┘     │
│   0d 00h 01m 12s                                         │
│   This clock started when you opened the page.           │
│   [ Start my 30 days ]   Free. 18+. No app store needed. │
└──────────────────────────────────────────────────────────┘
```

## 6. Depth and elevation

Flat content, floating chrome. Shadows appear only on glass elements and sheets, tinted toward `--tide-deep`: `0 8px 24px rgb(10 63 85 / 0.12)` in light. Dark mode uses no drop shadows; floating elements get a 0.5px inner highlight `rgb(255 255 255 / 0.08)` instead. Content cards have no shadow.

## 7. Motion

Motion answers a person's action or marks a milestone. The one ambient motion in the product is the Tide.

### Tokens

| Token | Value |
|---|---|
| `spring.ui` | stiffness 400, damping 34 (buttons, toggles, segments) |
| `spring.sheet` | stiffness 300, damping 30 |
| `spring.tide` | stiffness 120, damping 20 (water level changes) |
| `dur.tap` | 120ms |
| `dur.transition` | 280–350ms |
| `ease.standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |

Animate only `transform` and `opacity` (and canvas drawing). Use the View Transitions API for tab and page transitions where supported.

### Moments

- **Check-in:** the button morphs into a check and the label becomes "Day 12 held."; the water rises by one day with `spring.tide`; the minutes digit rolls. 600ms total.
- **Milestone (7, 14, 21, 30):** a brass ring draws around the clock and one glint crosses it once. 1.2s, never repeated on the same day. This is the peak moment.
- **Ride it out:** the Tide expands to full screen, 450ms shared-element transition.
- **Wave passed:** the crest flattens into a calm line and the HUD says "Wave passed." This is the end moment of every urge.
- **Reset:** no animation of loss. The Tide drains in a plain 300ms fade and the screen shows "Day 1 starts now."
- **Seconds** update without animation. Animating every second reads as jitter.

### Reduced motion

`prefers-reduced-motion: reduce` replaces springs with 150ms cross-fades, freezes the waves into a still waterline, swaps the milestone glint for a static brass ring, and makes the landing scroll sequence step between states.

## 8. Iconography and imagery

- Icons: Phosphor Icons (MIT), regular and fill weights. Iconly Pro is an approved alternative if a commercial license is bought. Never SF Symbols: Apple licenses them only for apps on Apple platforms.
- Sizes: 24 in the tab bar, 20 inline, 16 in chips.
- Imagery: abstract water, horizon lines, wave crests. No stock photography of people. Backgrounds from backgrounds.supply only when the license allows commercial use.
- App icon: a "W" drawn as two white wave crests side by side on the water gradient. No other text, no "NNN". It should look like a calm utility on a home screen.

## 9. Voice and tone

Plain, steady, adult. Second person. Short sentences. Specific over clever.

### Verb dictionary (an action keeps its name through the whole flow)

| Control | Confirmation |
|---|---|
| Start my 30 days | Your clock is running. |
| I held today | Day 12 held. |
| Ride it out | Wave passed. |
| Reset streak | Streak reset. Day 1 starts now. |
| Use a shield | Shield used for Tue 10 Nov. |
| Start a pact | Pact started. |
| Send nudge | Nudge sent. |
| Get Pro | You're on Pro. |
| Delete my account | Account deleted. |
| Sign my pledge (hold) | Pledge signed. |
| Set up my War Chest | (opens the setup flow) |
| Pay ₹499 into my War Chest | War Chest set: ₹499. |
| Make my promise (promise mode) | Promise made: ₹499. |
| Cancel my War Chest (first 24 hours) | War Chest cancelled. ₹499 is on its way back. |

### Rules

- Interface copy says "reset" or "slip". "Relapse" exists only in data models and research articles.
- Never: failed, weak, pathetic, loser, disgusting, sinful, dirty, alpha, beta, simp, or any shame framing.
- No sexual vocabulary in interface copy. "No Nut November" appears only as the event's name.
- No health or performance claims in interface copy, ever. Articles carry evidence grades and sources.
- Errors say what happened and how to fix it, without apologizing. Empty states invite one action.
- Notifications are discreet by default: "WillWar · Day 12. Tap to check in." Lock screens never mention the challenge's subject.
- Numbers are real or bracketed placeholders like [count]. No invented statistics or testimonials.
- Money copy is plain and guilt-free: "₹125 goes to [cause]. ₹375 is still yours if you keep going." Never "you lost", "wasted", "penalty" or "fine".

## 10. Do's and don'ts

**Do**
- Let the Tide be the only bold element on a screen.
- Keep Ride it out reachable with one thumb from every main tab.
- Design empty, loading, offline and error states for every screen.
- Show values large and labels small.
- Keep the free path visible on every paywall.

**Don't**
- Use a warm cream background with a serif display and terracotta accent, near-black with an acid-green accent, newspaper hairline layouts, or identical rounded card grids with grey shadows.
- Add all-caps eyebrow labels, middle-dot metadata strings, monospace data labels, or arrows appended to button text.
- Use numbered markers unless the content is a real sequence (the 30-day timeline is; feature lists aren't).
- Put ads, paywalls or sign-up walls between a person and Ride it out.
- Show anyone's reset reasons, times, or tags to anyone else.
- Pre-select a War Chest amount, show the offer more than once, or put any money prompt near Ride it out, ads or the paywall.
- Show War Chest amounts to anyone but their owner.

## 11. Responsive behavior

- Phone (320–480): the reference. Test at 375×667 (SE) and 393×852 (iPhone 15).
- Tablet and desktop app: the app column stays at 480px max, centered, with still water filling the background. The tab bar stays a capsule under the column.
- Landing: single column under 768px with the phone mock after the headline; two columns from 960px; the 30-day sequence keeps a sticky phone on desktop and becomes a stack of five captioned frames on small screens.
- Safe areas: honor `env(safe-area-inset-*)` on every edge; the tab bar and pill sit above the home indicator.
- Touch targets at least 44×44pt; focus rings visible (2px `--tide` outline, 2px offset) for keyboard users on desktop.

## 12. Agent prompt guide

When generating WillWar UI:

1. Read this whole file first. Use the tokens by name.
2. Before building, write a short plan: palette roles in use, type styles in use, an ASCII wireframe, and the one signature moment on the screen. Compare it with the don'ts in section 10 and revise anything generic.
3. Use system-ui for text and ui-rounded tabular numerals for numbers. No SF Pro files, no SF Symbols.
4. Build every state: default, empty, loading (skeletons, not spinners), offline ("Offline. Your clock keeps running; check-ins sync when you're back."), and error.
5. Write real copy from the verb dictionary. No lorem ipsum, no fake numbers.
6. Respect reduced motion and contrast. Check the Ride it out pill is reachable one-handed.
7. Before finishing, remove one decorative element.
