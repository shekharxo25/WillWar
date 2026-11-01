# WillWar design system: Fight Night

Source: `MASTER_PROMPT.md` Parts 2 and 3. Tokens live in `src/styles/tokens.css`; nothing else holds raw color values.

## 1. Concept

An urge is a round. You don't have to knock it out. You have to last it.

WillWar is set in an old-school boxing gym at night: painted concrete, chalk tally marks on the wall, an interval timer with red LED digits, a brass bell, worn leather gloves, athletic tape, fight posters taped up by the door, a championship belt in a case.

A professional round lasts three minutes, the same length as the visual task that weakened cravings in the University of Plymouth studies. The core interaction and the visual world are the same idea. The masculine character comes from real gym objects used the way gyms use them, not from clichés.

**Never:** skulls, flames, lightning, guns, knives, blood, bare torsos, any people or bodies, women, crowns, wolves, lions, "alpha", "sigma", energy-drink neon, military insignia, camouflage.

Structure follows Apple's design language (iOS 26): system font for text, inset grouped lists, a floating tab bar, sheets with detents, safe areas, haptic-style feedback. Fight Night supplies the skin, the type, the signature and the voice.

## 2. Rules that keep it from looking AI-generated

1. **Real artifacts, real conventions.** Every visual element is an object or convention from a boxing gym, used as it's used there. Timer lamps mean what gym lamps mean (green: round on; amber: last 30 seconds; red: rest). Posters follow real billing order. Tally marks are groups of four with a strike.
2. **Flat surfaces.** No gradient washes, glow blobs, mesh gradients, neon glows, lens flares, glassmorphism on content, or page-wide noise. The only texture: chalk strokes, and a letterpress edge on poster headlines (one SVG filter, used only there).
3. **Hard edges where the object is hard.** Timer housing radius 6, brass plates 2, buttons 10, cards and cells 12, sheets 16. Never one big radius on everything.
4. **One display face, used big and tight.** League Gothic. No italic or colored accent words in headlines, no gradient text, no tracked-out caps eyebrows, no monospace labels, no "→" on buttons, no middle-dot metadata strings.
5. **No AI-generated images, illustrations, icons or sounds.** Illustrations are hand-coded SVG line drawings of gym objects. The bell sound is a licensed or recorded sample.
6. **A trainer's voice.** Short, dry, specific. No hype words: unleash, ultimate, supercharge, journey, elevate, crush it, beast mode, level up.
7. **Restraint.** The Clock is the one bold element on any app screen; the poster is the one bold element on the landing page. Remove one decorative element before finishing each screen.
8. **Avoid the usual defaults:** cream background with serif and terracotta; near-black with acid green; newspaper hairline layouts; grids of identical rounded cards with grey shadows; centered hero with a big number and a gradient; fade-and-slide-up on every section.

## 3. Color

Dark is the default (a gym at night). Light ("day gym") follows the system setting or the user's choice.

### Dark

| Token | Value | Role |
|---|---|---|
| `--bg` | `#262422` | Gym floor: screen background |
| `--bg-raised` | `#33302D` | Concrete: cells, cards, sheets |
| `--housing` | `#0E0E0E` | Timer housing only |
| `--text` | `#ECEAE4` | Tape: primary text, primary buttons, selected tab |
| `--text-2` | `rgba(236,234,228,0.64)` | Secondary text |
| `--text-3` | `rgba(236,234,228,0.36)` | Placeholder, disabled, unselected tabs |
| `--hairline` | `rgba(236,234,228,0.12)` | 0.5px separators |
| `--led` | `#FF3B1F` | Clock digits, round timer, the Go a round button (5.4:1 on housing) |
| `--led-ghost` | `rgba(255,59,31,0.10)` | Unlit LED segments |
| `--lamp-go` | `#39D353` | Green lamp: checked in today; round on |
| `--lamp-warn` | `#FFB020` | Amber lamp: check-in pending; last 30 seconds |
| `--brass` | `#C9A24B` | Milestone plates and the Day 30 belt only (6.4:1 on --bg) |
| `--leather` | `#7A2A20` | "My row" accent, selected chip border |
| `--leather-wash` | `rgba(122,42,32,0.35)` | "My row" background |
| `--ink` | `#141414` | Text on tape-white and LED-red fills |
| `--destructive` | `#FF453A` | Delete account and cancel War Chest confirmations only |

### Light

| Token | Value |
|---|---|
| `--bg` | `#E4E2DD` (chalk wall) |
| `--bg-raised` | `#F2F1EE` |
| `--housing` | `#0E0E0E` (the timer stays black) |
| `--text` | `#1A1917` |
| `--text-2` | `rgba(26,25,23,0.64)` |
| `--text-3` | `rgba(26,25,23,0.36)` |
| `--hairline` | `rgba(26,25,23,0.14)` |
| `--led` | `#D93218` outside the housing, `#FF3B1F` inside it (`--led-housing`) |
| `--brass` | `#9C7A2E` (graphics); `--brass-ink` `#6E5520` for brass text |
| `--leather-wash` | `rgba(122,42,32,0.14)` |

In light mode, primary buttons are near-black ink fills with `#F2F1EE` labels (`--primary` / `--on-primary`).

Proportions: 60% concrete and chalk, 30% tape and ink text, 10% LED red (the Clock and the Go a round button). Brass appears only at milestones. Lamp colors appear only on lamps. **Red never means "you failed": resets are never red.**

## 4. Type

| Family | License | Use |
|---|---|---|
| League Gothic | SIL OFL | Display: screen titles, poster, big numbers, the Go a round label, plates. Uppercase allowed here only. |
| DSEG7 Classic | SIL OFL | LED digits in the Clock and round timer only, with an unlit "8" ghost behind each digit |
| system-ui stack | System | All other text (SF Pro on Apple devices without shipping it) |

Both OFL fonts are self-hosted (`src/app/fonts/`, loaded with `next/font/local`); licenses in `docs/licenses/`. Never embed SF Pro or use SF Symbols.

### App scale

| Style | Spec |
|---|---|
| Screen title | League Gothic 40/40, uppercase, 0.01em; collapses to system 17/600 inline title on scroll |
| Sheet title | League Gothic 28/30, uppercase |
| Big number | League Gothic 34–64 |
| LED | DSEG7 Classic 52px in the Clock, 72px in the round timer |
| Headline | system 17/22, 600 |
| Body | system 17/22, 400 |
| Subhead | system 15/20 |
| Footnote | system 13/18 |
| Tab label | system 11/13, 500 |

Per screen: at most four sizes and two system weights (400, 600). Inputs at least 16px.

### Landing scale

Poster "YOU" and "THE URGE" `clamp(96px, 22vw, 280px)` / 0.86; "vs." `clamp(28px, 4vw, 48px)`; H2 League Gothic `clamp(44px, 7vw, 96px)` / 0.92; lead system 20/30; body 17/26; text column at most 680px.

Sentence case for everything that isn't League Gothic display text. Values outrank labels ("12 d" big, "Current streak" small).

## 5. The Clock (the signature)

A gym interval timer, drawn as the physical object.

- **Housing:** `--housing` box, radius 6, 1px top highlight `rgba(255,255,255,0.06)`, two mounting screws (8px circles, `#2A2A2A`, a 1px slot) in the top corners. No glow.
- **Readout:** DD HH MM SS in DSEG7 Classic, `--led`, ghost "88" in `--led-ghost` behind each pair, steady colons. Labels d h m s in system 11px under each pair.
- **Lamps:** three 10px flat circles stacked on the left. Green lit when today is checked in; amber when today's check-in is pending or before the season starts; red only during an active round. Unlit lamps at 18% opacity.
- **Above:** "DAY 12" in League Gothic 64 and Footnote "of 30, ends Mon 30 Nov".
- **Tally:** 30 slots in groups of five (four verticals, one diagonal strike), 3px chalk strokes in `--text` at 85%, deterministic hand-drawn jitter per stroke. One stroke per day kept (held or shielded). Strokes stay after a reset: "Down isn't out."
- **Milestone plates:** after strokes 7, 14 and 21, a brass plate (radius 2) engraved with the number. At 30, the belt plate: wider, "30" and the season or challenge name.
- **Pre-season:** the LED counts down, amber lamp, label "STARTS IN".
- **Go a round:** the housing expands into the full-screen round timer.

"DAY N" is the streak day: Day 1 starts at the streak start or the reset moment (`streakDay()` in `src/lib/time`).

## 6. Components

- **Tab bar:** floating capsule 16pt from the edges above the home indicator; smoked glass (`--bg-raised` at 82%, `saturate(160%) blur(20px)`, opaque under `prefers-reduced-transparency`). Glass only here and on the scrolled nav bar. Tabs: Today, Camp, Learn, Me. Phosphor Bold unselected (`--text-3`), Fill selected (`--text`).
- **Go a round button:** the one persistent action, on Today, Camp and Learn, 12pt above the tab bar. `--led` fill, `--ink` "GO A ROUND" League Gothic 22 with a filled glove. Height 56, radius 10. Compresses to a 56×56 glove square on scroll. Never behind a paywall, ad or sheet.
- **Buttons:** Primary `--text` fill, `--ink` 17/600, height 52, radius 10. Secondary `--bg-raised`. Plain: text, 44pt target. Destructive label only inside confirmation sheets. Pressed: `translateY(1px)`, 0.9 opacity, 90ms.
- **Cells:** inset grouped, `--bg-raised` on `--bg`, radius 12, 0.5px hairlines inset to the text, 52pt rows, 13pt sentence-case headers in `--text-2`.
- **Cards:** `--bg-raised`, radius 12, padding 20, no shadow, no border.
- **Sheets:** `--bg-raised`, top radius 16, 36×5 grabber, medium and large detents, drag to dismiss, 50% dim, League Gothic title.
- **Toast:** a strip of tape: `--text` fill, `--ink` text, radius 4, top center, 2.4s.
- **Segmented control:** `--bg` track, `--text` thumb, `--ink` label, 34pt.
- **Intensity scale (1–10):** two rows of five 52pt squares, radius 6; selected `--led` fill, `--ink` numeral. End labels "Barely there", "Overwhelming". "Skip" plain.
- **Chips:** radius 8, `--bg-raised` with hairline; selected `--text` fill, `--ink` label. Max shown ("Pick up to 3").
- **Locker plates (avatars):** 36px square, radius 4, `--text` fill, seeded two-digit number in League Gothic 22 `--ink`. No photo uploads anywhere.
- **Board row:** rank League Gothic 22 `--text-3`; locker plate; handle system 17; value League Gothic 30 with system 13 unit. My row: 3px `--led` bar at the left edge and `--leather-wash`. Stale rows (two days without a check-in): value in `--text-3` with "Paused".
- **Evidence chip:** Strong `--text` fill; Moderate 1px outline; Mixed `--bg-raised` `--text-2`; Myth dashed outline with a strike icon.
- **Sponsored card:** article-card footprint, "Sponsored" footnote top-left, dashed hairline border. Never imitates an article title or uses LED red.
- **War Chest card:** `--bg-raised`, amount League Gothic 40, split bar: still yours in `--text`, given to the cause hatched. "Comes back on Tue 1 Dec" and the cause. Never red, never "lost". Phosphor vault icon.
- **Pledge signature:** pledge in system 22/28, a rule line, "Hold to sign" fills over 3 seconds (releasing early drains it); the handle appears on the line in League Gothic 28. Toast "Pledge signed."
- **Inputs:** 52 tall, radius 10, `--bg-raised`, 17px. Errors below in Footnote `--destructive`, saying how to fix it.
- **Wheel picker:** iOS-style, for date of birth and "I already started".
- **Empty states:** a 2px line drawing of a gym object in `--text-2`, one sentence, one action.

## 7. Layout

8-point grid (4 for fine steps). Spacing scale 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96. Screen margins 16 (20 at 414pt and wider). Primary actions in the bottom third. App column capped at 480px, centered over `--bg`.

```
Today (iPhone 15, 393×852)
TODAY                          [27]   title, locker plate → Me
DAY 12        of 30, ends Mon 30 Nov
┌o─────────────────────────o┐         housing with screws
│ ●   12 : 04 : 31 : 08     │         lamps + LED readout
│ ○    d    h    m    s     │
└───────────────────────────┘
||||/ ||||/ ||          [7]           chalk tally + brass plate
[        I held today        ]        primary
┌ Corner talk ──────────────┐
│ Day 12. Phone out of the bedroom tonight.
└───────────────────────────┘
  Camp: 3 of 4 checked in   ›         inset cells
  War Chest: ₹375 still yours ›       only if set up
[ (glove)   GO A ROUND        ]       LED red
( Today  Camp  Learn  Me )            smoked glass tab bar
```

Round (full screen): "ROUND", Pause, End; housing with the green lamp and 2:47; the game canvas. No tab bar, no ads.

Landing hero: the poster taped to the wall: "WillWar presents", YOU, vs., THE URGE, the date line, a live LED housing, "Your clock started when you opened this page.", "Start my 30 days", "Free. 18+ only."

## 8. Motion and sound

| Token | Value |
|---|---|
| `dur.snap` | 90ms |
| `dur.ui` | 180ms |
| `spring.sheet` | stiffness 500, damping 40 |
| `ease.mech` | `cubic-bezier(0.3, 0, 0.2, 1)` |

- LED digits change instantly. No tweening, no rolling numbers. Lamps switch with a 60ms opacity flick.
- Check-in: the label becomes "Day 12 held.", one chalk stroke draws (260ms), the green lamp lights.
- Milestone (7, 14, 21, 30): the brass plate stamps in (scale 1.12 → 1 over 140ms, 2px settle). Once per day. The peak moment.
- Go a round: the housing expands to full screen, 320ms.
- Round end: the LED blinks twice (120ms on/off), the optional bell sounds, toast "You went the distance." The end moment of every urge.
- Reset: the LED snaps to zeros with no animation. Tally strokes stay.
- Landing: one orchestrated moment only (Thirty days, chalked).
- Animate transform and opacity only (plus canvas). View Transitions for tab changes.
- Reduced motion: strokes and plates appear without drawing or stamping; the expand becomes a 120ms cross-fade; no LED blink.
- Sound: a short brass bell at round end, off by default (Settings → "Round bell"), only after a user gesture. Android can vibrate on the bell; iOS web can't, so don't promise it.

## 9. Icons, imagery and brand assets

- Icons: Phosphor Bold and Fill. Boxing glove (hand-coded), bell, timer, users (Camp), book (Learn), user circle (Me), vault (War Chest). No SF Symbols.
- Illustrations: hand-coded 2px line SVGs (`src/components/illustrations`): heavy bag on a chain, gloves on a hook, ring bell, rolled hand wraps, a taped poster corner.
- App icon: one chalk tally group (four strokes and a strike) in `--text` on `--bg`. No text. Variants: iOS 180 (opaque), Android maskable (mark inside the central 80%), monochrome glyph, favicon (SVG and 32px). Generated by `npm run icons`.
- Launch screen: the mark centered on `--housing`.
- Open Graph image (1200×630): the poster, "YOU vs. THE URGE", "30 days".
- Share card (1080×1920 and 1080×1080): "DAY 17", "of 30", the tally and a strip of the LED housing. Handle and challenge name hidden by default.

## 10. Voice and verb dictionary

A trainer in your corner: plain, dry, short, specific. Encouraging without hype.

On-brand: hold the line, go the distance, get up, last the round, camp, corner, grit, discipline.

Never: alpha, beta, sigma, simp, "real men", anything about women, shame words (failure, weak, pathetic, loser, disgusting, dirty, degenerate), sexual vocabulary (No Nut November appears only as the event's name), health or performance claims, hype words, invented statistics or testimonials. "Reset" or "slip" in the interface; "relapse" only in code and research articles.

| Control | Confirmation |
|---|---|
| Start my 30 days | Your clock is running. |
| Sign my pledge (hold) | Pledge signed. |
| I held today | Day 12 held. |
| Go a round | You went the distance. |
| Reset streak | Down isn't out. Day 1 starts now. |
| Use a shield | Shield used for Tue 10 Nov. |
| Start a camp | Camp started. |
| Send nudge | Nudge sent. |
| Get Pro | You're on Pro. |
| Set up my War Chest | (opens setup) |
| Pay ₹499 into my War Chest | War Chest set: ₹499. |
| Make my promise | Promise made: ₹499. |
| Cancel my War Chest (first 24 hours) | War Chest cancelled. ₹499 is on its way back. |
| Delete my account | Account deleted. |

Notifications are discreet by default: "WillWar: Day 12. Tap to check in." Money copy never says lost, penalty, fine or wasted.

---

# Screens and copy (Part 3)

Every screen needs default, empty, loading (skeletons), offline ("Offline. Your clock keeps running; check-ins sync when you're back.") and error states where they apply.

## 3.1 Landing page `/`

1. **Header:** "WillWar" wordmark left, "Sign in" right. Smoked glass after scroll. On mobile, once the hero button scrolls away, a bottom bar with "Start my 30 days".
2. **Hero (the poster):** taped at the top corners. "WillWar presents", "YOU", "vs.", "THE URGE" (letterpress edge), "30 days. 1–30 November. Your phone." A live LED strip counting from zero since page load, "Your clock started when you opened this page." Primary "Start my 30 days" → `/app/start`; beside it "Free. 18+ only. Installs from your browser." Off-season (`SEASON_MODE=rolling`): "30 days. Starting tonight."
3. **Thirty days, chalked** (the one orchestrated motion moment): a sticky phone shows the Clock and tally; scrolling draws strokes from Day 0 to 30; plates stamp at 7, 14, 21; the belt at 30. Captions: Day 1 "The easy one. Pick your reason and tell one friend." Day 3 "Boredom shows up swinging. Have a three-minute plan." Day 7 "First plate on the wall. Your camp sees it." Day 14 "Halfway. Your log shows what sets you off." Day 21 "Now the routine does the work." Day 30 "December 1st. The record stays, even if you go again." Reduced motion: six still frames. Mobile: a stack of six captioned frames.
4. **Go a round:** "An urge is a round. Last three minutes." Plymouth study body copy; demo housing at 0:10 with "Hold to last a 10-second round" (green lamp, amber at 0:03, blink, "You went the distance."; release pauses; Space works). Source: "Skorka-Brown et al., Addictive Behaviors, 2015." The three games: Kitbag, Bag, Combos.
5. **Camps:** "Train with the friends who'll actually check." Board mock (rohan_k, dev_s, quietmile, you), segmented control, my row marked. "Handles, not names. Your camp sees your number, never the reason it reset."
6. **War Chest:** "Put something on it." Body, the card (₹499: ₹375 still yours, ₹125 given), Giné, Karlan and Zinman 2010 footnote, "Optional. Free to skip. Honor system: nobody checks but you." Promise mode adds "Name an amount and a cause. If you reset, you donate your share yourself."
7. **Corner talk:** "A word from your corner, every morning." Steady, Stoic, Coach, Playful samples.
8. **Privacy:** "Your record is yours." Four statements with icons.
9. **Learn:** "Straight answers. Graded." Three graded cards.
10. **Pricing:** Free and Pro (season pass ₹149 / $3.99, annual ₹799 / $24.99). "Prices include taxes. Cancel anytime in Settings. The War Chest is separate, optional, and available on Free and Pro."
11. **Questions:** seven FAQs.
12. **Footer:** wordmark, "A 30-day streak tracker for adults.", Product, Help, Legal, "18+ only. Not medical advice."

## 3.2 Onboarding `/app/start`

1. Age gate: "WILLWAR IS FOR ADULTS." Date of birth wheel, used once, never stored. Under 18: "WillWar is for people 18 and over. If you're working on a habit, talk to someone you trust. Tele-MANAS is free and open 24/7 at 14416." Nothing stored.
2. Pick your challenge: No Nut November 2026 (1–30 November), 30 days from today, or Set my own end date. "I've already started" → back to the season start or 48 hours. "Honor system. Your camp trusts you."
3. "WHAT'S IT FOR?" Pick up to 3: Focus, Discipline, Better sleep, Less scrolling, Faith or values, Prove it to myself, My friends challenged me, Something else.
4. "MAKE IT OFFICIAL." Hold to sign → "Pledge signed." Plain "Skip", equally legible. No money or Pro here.
5. Corner talk tone with live samples.
6. "PICK A HANDLE." 3–20 lowercase letters, numbers, underscores; live availability; locker plate preview with "Shuffle".
7. Save your record: email (6-digit code) or Google.
8. Install coach (if not installed): iOS three steps; Android "Install WillWar"; "Not now".
9. Reminders (installed app only): time wheel (21:30), "Discreet notifications" on, preview "WillWar: Day 12. Tap to check in."
10. "WILLWAR PRO" paywall with an equally clear "Continue with Free". No fake timers or pre-selected upsells.

Progress bar on steps 2–7 only. Back on every step after 1.

## 3.3 Today `/app/today`

Per the wireframe. States: pre-season countdown; active not checked in (amber); checked in (green, "Day 12 held."); milestone day; paused after two missed days ("Check in to show on your camp's board again." no red); offline banner; corner talk skeleton (the Clock never loads; it's computed on the device). On the first held day only, if eligible, the War Chest offer sheet rises after the toast.

## 3.4 Go a round `/app/round`

R1 "HOW STRONG IS IT?" keypad, "Skip". R2 "PICK YOUR ROUND.": Kitbag (Free, "Pack the bag."; drag blocky gear shapes into a grid bag; nothing that resembles Tetris), Bag (Free, "Breathe with the bag."; in 4s, out 6s), Combos (Pro, "Hit the pads."; repeat mitt sequences). R3 full-screen round: 3:00 LED, green lamp, amber at 0:30; Pause and End; no tab bar, no ads, no prompts; Wake Lock on. R4 "HOW STRONG IS IT NOW?" R5 "YOU WENT THE DISTANCE." before → after, "Rounds lasted: 14", "Back to Today", "Go another round"; Free: "Earn a streak shield: watch a short ad" (opt-in). If after-score ≥ 8: "Send your camp a nudge", "Talk it through" (Pro coach), "Get up and move: 20 squats or a walk outside".

## 3.5 Camp `/app/camp`

C1 empty (gloves on a hook): "No camp yet. A camp is a few friends who see each other's streaks." "Start a camp" / "Join with a code". C2 start sheet ("Free camps hold up to 5. Pro holds up to 50."). C3 invite sheet (link, code in League Gothic). C4 camp home: challenge card, segmented Current / Best / Days with one-line definitions, the board, "Nudge" per row, "Updated just now". C5 five preset nudges. C6 new challenge (Pro). C7 opt-in global board.

## 3.6 Learn

Feed with search, filters (All, Strong, Moderate, Mixed, Myth), cards; one Sponsored card after every sixth article for Free users. Article: evidence box at top, body 17/26 at 68 characters, sources, "Not medical advice. If this is affecting your life, talk to a doctor or counselor."

## 3.7 Me and Settings

Me: handle and plate; stats (Current streak, Best streak, Rounds lasted, Average drop after a round); 30-day calendar (held: tape square; shielded: outlined; reset: small neutral dot; never red); trigger insights (Pro); streak history; War Chest row or "Back your pledge". Settings: Account; Challenge; Notifications (time, discreet, Night watch at 23:00, Round bell); Privacy (Who sees your streak, Backed badge, Export, Delete); Appearance (System / Dark / Light; clock skins: Pro); Subscription; Support and safety; Legal. Delete sheet: type "delete"; refunds any stake first.

## 3.8 Reset

X1 "RESET YOUR STREAK?" "Your best streak (12 days) and your tally stay on the wall. Your camp sees a new count, never the reason." War Chest line ("₹125 goes to [cause]. ₹375 is still yours if you keep going."). Optional tags: Late night, Bored, Stressed, Alone, Scrolling, Drinking, Something else. "Reset streak" (secondary, not red), "Cancel". X2 "DOWN ISN'T OUT." "Day 1 starts now." "One reset doesn't erase 12 days. Pick one thing to change tonight."

## 3.9 War Chest `/app/war-chest`

W1 offer (once ever) "BACK YOUR PLEDGE?" with equal-width "Set up my War Chest" / "Not now". W2 amount (nothing pre-selected; "Pick an amount you'd notice, not one that would hurt."). W3 rule: Steady (25% per reset, recommended) or Strict (all on the first reset). W4 cause. W5 review ("Honor system. Nobody can check this but you."). W6 confirmed. W7 detail and timeline. W8 after a reset. W9 end. W10 promise mode ("You promised ₹125 to [cause] for this reset." with "Donate now"). No ads, no Pro upsell, no countdowns on any War Chest screen.

## 3.10 Support

Tele-MANAS (India), free, 24/7: 14416 or 1-800-891-4416. 988 Suicide & Crisis Lifeline (US): call or text 988. Samaritans (UK): 116 123. Elsewhere: findahelpline.com. No imagery.
