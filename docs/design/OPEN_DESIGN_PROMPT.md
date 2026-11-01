# Document 1 — Design prompt for Open Design

Prompt pack for designing the WillWar landing page and PWA in Open Design. Use it with `DESIGN.md` from the same folder.

Open Design takes three inputs per project: a skill (the kind of artifact), a design system (a DESIGN.md brand contract), and a brief. This pack supplies the design system and the briefs. Skill names below are the ones Open Design ships today; if your build names them differently, pick the closest match.

---

## How to run this in Open Design

1. **Connect an agent.** Open the desktop app (or run `pnpm tools-dev run web`) and connect the coding agent or model you use.
2. **Create the design system.** Design System → New → name it "WillWar" → paste the full contents of `DESIGN.md`. Set it as the default for both projects below.
3. **Load your own skills (optional, recommended).** If you put your `Frontend_Design.md` and `Mobile_App_Design.md` into Open Design's skills folder as `SKILL.md` packages, enable both, plus the built-in `critique` skill.
4. **Project 1, landing page.** Prototype → platform: responsive web, fidelity: high → skill: `saas-landing` (or `web-prototype`) → paste **Block 0** and **Brief A** together.
5. **Project 2, the app.** Prototype → platform: mobile (iPhone frame) → skill: `mobile-app` (use `gamified-app` for Brief B2) → paste **Block 0** and **Brief B1**. Iterate until it's right, then send B2, B3, B4 and B5 in the same project so screens stay consistent.
6. **Motion.** Run **Brief C** on the chosen landing and Today/Urge outputs (use an animated or HyperFrames skill if your build has one).
7. **Brand assets.** Run **Brief D**.
8. **Critique.** After every brief, run the **Critique prompt** at the end of this file and apply the fixes.
9. **Export.** Export HTML and PNG screenshots of each final screen into the repo at `design/exports/` with the file names listed in Handoff.

Send screens in batches of three to five. Long multi-screen briefs in one go produce shallow screens.

---

## Block 0 — Shared context (paste above every brief)

```
You are the design lead for "WillWar", a mobile-first Progressive Web App for the No Nut November challenge and rolling 30-day resets. The attached WillWar DESIGN.md is the brand contract: use its tokens, type styles, components, motion and voice exactly.

Audience: men 18–34 (strictly 18+), heavy phone users who often open the app late at night, privacy-anxious, competitive with a few close friends, meme-literate but tired of hype. Primary market India; also the US and UK.

What exists:
- Landing page: one interactive page whose single job is getting a visitor to tap "Start my 30 days". "Sign in" is secondary.
- The PWA (installed from the browser, should feel like a native iOS app):
  • the Tide: a live streak clock to the second, drawn as a rising water level
  • a daily check-in ("I held today")
  • a daily AI-written "morning line" (affirmation) in a tone the user picks
  • "Ride it out": urge mode with three-minute visual mini-games (Drift, Swell, Knots), logging urge intensity before and after
  • Pacts: small friend groups with challenges and three leaderboards — current streak, best streak this season, days kept this season
  • Learn: articles with an evidence grade (Strong, Moderate, Mixed, Myth) and sources
  • the War Chest: an optional money commitment, offered once, after the user has signed a free pledge and held their first day. Each reset sends part of it to a cause the user picks; whatever is left comes back when the challenge ends. WillWar never keeps any of it
  • Free tier with ads; Pro behind a hard paywall

Hard constraints:
- Apple design language (iOS 26, Liquid Glass) translated to the web, using only legal assets: the system-ui font stack and ui-rounded tabular numerals. No SF Pro font files. No SF Symbols. Icons are Phosphor.
- No sexual imagery, no bodies, no people photography, no women. No weapons, soldiers, helmets, camouflage, blood or military insignia, despite the name. No flames, lightning, skulls, crowns or "alpha" motifs. The visual world is water: tide, waves, a steady horizon, dawn.
- Money copy is plain and guilt-free. Never "you lost", "penalty", "fine" or "wasted". Never pre-select an amount. The War Chest offer appears once and never near Ride it out, ads or the paywall.
- No invented statistics, user counts, ratings or testimonials. Where real data belongs, use a bracketed placeholder such as [count].
- No health or performance claims. Never say the challenge raises testosterone, energy, attraction, confidence, "aura" or anything physical.
- Copy: sentence case, plain verbs, the verb dictionary in DESIGN.md. No all-caps eyebrows, no "→" on buttons, no middle-dot metadata strings, no monospace data labels, no single accented word in a headline.
- Accessibility floor: WCAG AA contrast, 44×44pt targets, visible focus, a prefers-reduced-motion version of every animation.
- Every screen needs default, empty, loading, offline and error states where they apply.

Process:
1. Write a short design plan first: palette roles used, type styles used, an ASCII wireframe, and the one signature moment.
2. Compare the plan against generic defaults (cream + serif + terracotta; near-black + acid green; newspaper hairlines; identical rounded cards with grey shadows; centered hero with a big number and gradient). Say what you changed and why.
3. Then build. Before finishing, remove one decorative element.
```

---

## Brief A — Landing page

```
Build the WillWar landing page: one page, responsive, interactive, Apple-marketing-page discipline (big type, generous space, one product-in-hand moment).

SINGLE JOB: get a visitor to tap "Start my 30 days" tonight. "Sign in" is the only other action in the header.

SIGNATURE (spend the boldness here, keep the rest quiet):
"Scroll through your 30 days." A sticky iPhone shows the Tide. As the visitor scrolls the next section, the day counter advances from Day 0 to Day 30, the water rises, and the milestone ticks at 7, 14, 21 and 30 turn brass with one glint each. Captions change at six points. This is the page's one orchestrated motion moment. With reduced motion it becomes six still frames.

SECTIONS, IN ORDER

1. Header
   Wordmark "WillWar" left; "Sign in" plain button right. Glass after scroll. On mobile, once the hero CTA scrolls away, a slim glass bar appears at the bottom with "Start my 30 days".

2. Hero
   H1: "Make it to December."
   Lead: "A streak clock that counts every second, a three-minute game for when the urge hits, and a private leaderboard with the friends you trust."
   Live clock (ui-rounded, tabular): starts at 0d 00h 00m 00s on page load and ticks every second.
   Under it, Footnote: "This clock started when you opened the page."
   Primary button: "Start my 30 days"
   Microcopy beside or under it: "Free. 18+ only. Installs from your browser, no app store."
   Visual: an iPhone (generic frame, no Apple logo) showing the Today screen with the Tide at Day 0, waves moving slowly.
   Off-season variant (design it too, as a toggle): H1 "Thirty days. Starting tonight."

3. Scroll through your 30 days (the signature)
   Captions, one at a time, synced to the day counter:
   Day 1 — "The easy part. Pick your reason and tell one friend."
   Day 3 — "Boredom shows up. Have a three-minute plan for it."
   Day 7 — "First milestone. Your pact sees it light up."
   Day 14 — "Halfway. Your urge log shows what sets you off."
   Day 21 — "The routine is doing the work now."
   Day 30 — "December 1st. Your record stays, even if you go again."

4. Ride it out
   H2: "Urges crest. Then they fall."
   Body: "Tap Ride it out and play a three-minute visual puzzle. In a week-long study at the University of Plymouth, three minutes of a block puzzle made cravings noticeably weaker, for food and drink as well as activities like sex."
   Interactive demo: a wide card with a calm waterline and a button "Hold to ride a wave". While held, a wave rises for 3 seconds, crests, and falls for 3 seconds; the card then says "Wave passed." Releasing early pauses the wave where it is and lets it settle. Keyboard: Space held does the same.
   Footnote with source link: "Skorka-Brown et al., Addictive Behaviors, 2015."
   Small row of the three games as icons with names: Drift, Swell, Knots.

5. Pacts
   H2: "Bring the friends who'll actually check."
   A pact leaderboard mock with four pebble avatars and handles (e.g. rohan_k, dev.s, quietmile, you), a segmented control Current / Best / Days, and "my row" highlighted.
   Body: "Handles, not names. Your pact sees your number, never the reason it reset."

6. War Chest
   H2: "Put something on it."
   Body: "Pick an amount and a cause you care about. Each reset sends a quarter of it to that cause. Make it to the end, and whatever's left comes back to you. WillWar never keeps any of it."
   Visual: the chest card from DESIGN.md showing ₹499, with the bar three-quarters Tide ("Still yours: ₹375") and one quarter neutral ("Given to [cause]: ₹125").
   Footnote with source link: "In a field study, smokers offered a contract like this, with their own money returned on success and given to charity otherwise, were more likely to quit. Giné, Karlan and Zinman, 2010."
   Small print: "Optional. Free to skip. Honor system: nobody checks but you."
   (Design a promise-mode variant too, where no money moves: "Name an amount and a cause. If you reset, you donate your share yourself.")

7. Morning line
   H2: "One line every morning, written for your day."
   Four example cards, one per tone (label each with its tone name):
   Steady — "Day 9. You've already handled nine evenings like this one. Handle tonight the same way."
   Stoic — "Day 9. The urge asks for your attention. Give it three minutes of breathing instead."
   Coach — "Day 9. Phone out of the bedroom tonight. That's the whole plan."
   Playful — "Day 9. Single digits for one more day. Make tomorrow a double."

8. Privacy
   H2: "Your streak is yours."
   Four plain statements in a 2×2 grid, each with a Phosphor icon:
   "We never ask for your real name."
   "Your journal stays on your phone."
   "Ads here never use what you do in the app."
   "Delete everything in one tap."
   (These are product commitments. Do not add claims the product doesn't make.)

9. Learn
   H2: "Straight answers, graded."
   Body: "Every article shows how strong the evidence is. When the internet says one thing and the research says another, we show you both."
   Three article cards with evidence chips:
   Myth — "The day-7 testosterone claim, traced to its source"
   Moderate — "Why one slip turns into a week, and how to stop it"
   Moderate — "Three minutes of a puzzle versus a craving"

10. Pricing
   Two columns.
   Free: streak clock, daily check-in, daily morning line, two urge games, one pact of up to five friends, all articles, includes ads. Button: "Start free".
   Pro: everything in Free plus all games, a coach to talk you through urges, unlimited pacts up to 50 people, custom challenges, trigger insights, two streak shields a month, encrypted journal backup, tide themes, no ads. Prices as placeholders: Season pass ₹[149] / $[3.99]; Annual ₹[799] / $[24.99]. Button: "Get Pro".
   Footnote: "Prices include taxes. Cancel anytime in Settings. The War Chest is separate, optional and available on Free and Pro."

11. Questions (accordion, real answers)
   "Is WillWar for under-18s?" — "No. WillWar is for adults only."
   "Does it work on iPhone?" — "Yes. Open the site in Safari, tap Share, then Add to Home Screen."
   "What happens if I slip?" — "Tap Reset streak. Your best streak stays on your record, and there are no lectures."
   "Will my friends see why I reset?" — "No. Your pact sees your current number. Never the reason, the time, or any notes."
   "Does it work offline?" — "Your clock keeps running offline. Check-ins sync when you're back."
   "Is this medical advice?" — "No. If urges or habits are hurting your life, talk to a doctor or counselor."
   "What's the War Chest?" — "An optional amount you put behind your pledge. Each reset sends a quarter to the cause you chose; the rest comes back to you when your challenge ends. We never keep any of it, and we only ask once."

12. Footer (reference footer.design)
   Wordmark, short line "A 30-day streak tracker for adults.", columns: Product (Today, Pacts, Learn, Pricing), Help (Install on iPhone, Get support, Contact), Legal (Privacy, Terms, Health disclaimer). Bottom: "18+ only. Not medical advice." and the copyright line.

INTERACTION AND BUILD NOTES
- One orchestrated moment only (section 3). Everything else appears without fade-and-slide entrances.
- Hero clock and hold-to-ride are user-facing interactions and must work on touch, mouse and keyboard.
- The CTA routes to /app/start; "Sign in" routes to /app/sign-in.
- Mobile first: 375px wide must look deliberate, not squeezed.
- Desktop text column ≤ 680px; left-aligned outside the hero.
- Show the reduced-motion version as a second frame.
```

---

## Brief B1 — Onboarding (10 screens)

```
Design the WillWar onboarding flow inside the iPhone frame. Order and content:

1. Age gate
   Large title: "WillWar is for adults."
   Body: "Enter your date of birth. We use it once to confirm you're 18 or over and don't store it."
   iOS wheel picker (day, month, year). Primary: "Continue".
   Under-18 state: title "WillWar is for people 18 and over." body "If you're working on a habit, talk to someone you trust. Tele-MANAS is free and open 24/7 at 14416." No sign-up option, no data collected.

2. Pick your challenge
   Title: "Pick your challenge."
   Three large selectable cards:
   "No Nut November 2026" — "1–30 November" (before 1 Nov show a countdown: "Starts in 4h 12m")
   "30 days from today" — "Ends [date]"
   "Set my own end date"
   Toggle row: "I've already started" → reveals a wheel to pick the start (up to the season start, or 48 hours back otherwise) with Footnote "Honor system. Your pact trusts you."
   Primary: "Continue".

3. Your reason
   Title: "What's it for?" Subtitle: "Pick up to 3. Your morning line uses these."
   Chips with Phosphor icons: Focus, Discipline, Better sleep, Less scrolling, Faith or values, Prove it to myself, My friends challenged me, Something else.

4. Sign your pledge (the small first yes)
   Title: "Make it official."
   Pledge text (Title 2, three lines, filled from earlier answers): "Until Mon 30 November, I'll ride out the urge instead of giving in. I'm doing it for focus."
   Capsule button "Hold to sign": holding for 3 seconds fills it with Tide; releasing early drains it. On completion the handle placeholder is written under the pledge and a HUD says "Pledge signed."
   Plain "Skip" button beneath, equally legible. No money, no Pro, no incentives on this screen.

5. Morning line tone
   Title: "How should your morning line sound?"
   Four options (Steady, Stoic, Coach, Playful) as cells with a live sample line that updates when selected.

6. Handle
   Title: "Pick a handle." Body: "Your pact sees this. Don't use your real name."
   Input with validation (3–20 letters, numbers, underscores) and live availability.
   Avatar pebble preview with "Shuffle".

7. Save your streak
   Title: "Save your streak."
   Buttons: "Continue with email" (sends a 6-digit code; design the code entry screen too) and "Continue with Google".
   Footnote: "Emails come from WillWar with plain subject lines."

8. Install coach (only when not already installed)
   iOS: three illustrated steps with real Safari UI shapes: tap Share, tap Add to Home Screen, open WillWar from your home screen. Button: "I've added it". Plain button: "Not now".
   Android: one primary "Install WillWar" button.
   Explain why in one line: "Installed, WillWar can remind you each day and works offline."

9. Reminders (only inside the installed app)
   Title: "When should we check in?"
   Time wheel, default 21:30. Toggle "Discreet notifications" on by default with a lock-screen preview: "WillWar · Day 12. Tap to check in."
   Primary: "Allow reminders". Plain: "Not now".

10. Pro paywall (hard paywall for Pro features)
   Title: "WillWar Pro"
   Feature list with icons (all games, coach, unlimited pacts, challenges, trigger insights, 2 shields a month, journal backup, tide themes, no ads).
   Plan selector: Season pass ₹[149] (until 30 Nov) / Annual ₹[799] (marked "Best value"). Prices include taxes.
   Primary: "Get Pro". Visible plain button of equal clarity: "Continue with Free".
   Footnote: renewal terms, "Cancel anytime in Settings", Restore (= sign in).
   No fake countdowns, no pre-selected upsells, no guilt copy.

Progress: a thin progress bar at the top for steps 2–7 only (a real sequence). Back button top-left on every step after 1.
```

---

## Brief B2 — Today and Ride it out (use the gamified-app skill)

```
Design Today and the full Ride it out flow.

TODAY
Layout per the DESIGN.md wireframe: large title "Today", avatar button → Me, the Tide card, "I held today" primary button, Morning line card, inset cells "Pact · 3 of 4 checked in ›", "Streak shields 1 ›" and, when one exists, "War Chest · ₹499 still yours ›", the Ride it out pill above the floating tab bar.
States to draw:
- Before the season starts: the Tide shows a countdown "Starts in 4h 12m" with still water at zero.
- Active, not checked in today.
- Checked in: button replaced by "Day 12 held." with a check, water risen.
- First held day, once ever: after "Day 1 held." settles, the War Chest offer sheet rises (designed in Brief B5). It never appears during Ride it out, between 23:00 and 06:00, or after a crisis card in the last 7 days.
- Milestone day (Day 7): brass ring around the clock, Morning line card mentions the milestone.
- Paused: no check-in for two days: a gentle cell "Check in to show on your pact's board again." No red, no shame.
- Offline banner: "Offline. Your clock keeps running; check-ins sync when you're back."
- Loading: skeleton for Morning line only (the clock is computed on device and never loads).

RIDE IT OUT (full-screen, entered from the pill with the Tide expanding)
U1 "How strong is it right now?" — 1–10 scale (two rows of five circles), "Skip".
U2 "Pick a game." — three cards, each with "3 min":
   Drift — "Fit the pieces onto the raft." (spatial puzzle; must NOT look like Tetris: no falling tetrominoes, no well, no Tetris colors)
   Swell — "Breathe with the wave." (paced breathing, 4 in, 6 out)
   Knots — "Untangle the lines." (Pro badge)
U3 In-game: immersive canvas; top shows a thin wave progress line from 3:00 to 0:00, plus Pause and End (plain). No tab bar, no pill, no ads.
U4 "How strong is it now?" — same scale.
U5 "Wave passed." summary: before → after (e.g. 8 → 4) as two numerals joined by a falling wave line; "Waves ridden: 14"; primary "Back to Today", secondary "Play another round".
   Free tier only, below the buttons and visually quieter: a card "Earn a streak shield — Watch a short ad". Opt-in only.
   If the after-score is still 8 or higher, show a support row instead of the ad card: "Send your ally a nudge", "Talk it through" (Pro coach), "Step outside or do 20 squats".

Draw each game's first frame and mid-game frame. Games are one-handed, portrait, thumb-friendly.
```

---

## Brief B3 — Pacts and leaderboards

```
Design the Pact tab.

P1 Empty: calm-sea illustration. "No pact yet. Pacts are small groups of friends who see each other's streaks." Primary "Start a pact", secondary "Join with a code".
P2 Start a pact (sheet): name field, "Link to No Nut November 2026" toggle (on by default in season), Footnote "Free pacts hold up to 5 people. Pro holds up to 50." Primary "Start pact".
P3 Invite (sheet): system share button "Share invite link", the link, a QR code, the code in large rounded numerals, "Invites open the app straight to this pact."
P4 Pact home: title = pact name, "4 people". Segmented control: Current / Best / Days, with one-line explanations below:
   Current — "Time since each person's last reset."
   Best — "Longest streak during No Nut November 2026."
   Days — "Days checked in as held during the season."
   Ranked leaderboard rows (see DESIGN.md), my row highlighted, a "Paused" row example, a "Nudge" plain button per row.
   Challenge card above the board: "First to 14 days · ends Fri 20 Nov" with progress pebbles.
P5 Nudge (sheet): five preset messages as large rows — "Proud of you", "Ride it out, you've got this", "Day one counts", "Almost there", "I'm with you". No free text.
P6 New challenge (Pro): type picker (First to X days, Longest streak, Most days kept), dates, Primary "Start challenge".
P7 Global board (opt-in): top 100 handles with my rank pinned at the bottom; a settings link "Choose who sees your streak".
Realtime cue: a subtle "Updated just now" Footnote, no spinners.
```

---

## Brief B4 — Learn, Me, Reset, Settings

```
Design the remaining screens.

L1 Learn feed: large title "Learn", search field, filter chips (All, Strong, Moderate, Mixed, Myth), article cards (title, one-line summary, evidence chip, read time). Free tier: one Sponsored card after every sixth article, per DESIGN.md.
L2 Article: large title, an evidence box at the top ("Evidence: Mixed" + "What the research supports" and "What it doesn't" as two short paragraphs), body text at 17/26 with 68-character measure, sources list at the end, Footnote "Not medical advice. If this is affecting your life, talk to a doctor or counselor."

M1 Me: handle and pebble; a 2×2 stat grid (Current streak, Best streak, Waves ridden, Average drop after a game); a 30-day calendar heatmap (held = Tide, shielded = Tide outline, reset = neutral dot, empty = blank; never red); Trigger insights card (Pro; free users see a locked preview with "See what sets you off — Pro"); History list of past streaks; a "War Chest" row (amount still yours, end date) or, if none, a quiet "Back your pledge" row.
M2 Settings (inset grouped): Account (handle, email, sign out); Challenge (current challenge, change end date); Notifications (reminder time, discreet notifications, Night watch: "A gentle check-in at 23:00"); Privacy ("Who sees your streak": Only me / My pacts / Everyone; "Show a Backed badge" toggle; Export my data; Delete my account); Appearance (System / Light / Dark, Tide theme — Pro); Subscription; Support and safety (Get support now, Report a problem); Legal.
M3 Delete account (sheet): explains what is deleted and when, requires typing "delete", destructive button "Delete my account".

R1 Reset streak (sheet from Today or Me):
   Title "Reset your streak?"
   Body "Your best streak (12 days) stays on your record. Your pact sees a new count, never the reason."
   With a War Chest, one more line in the same calm style: "₹125 goes to [cause]. ₹375 is still yours if you keep going." (Strict rule: "Your ₹499 goes to [cause].")
   Optional chips "What was going on?" — Late night, Bored, Stressed, Alone, Scrolling, Drinking, Something else. "Skip" allowed.
   Buttons: "Reset streak" (destructive), "Cancel".
R2 After reset: Today shows "Day 1 starts now." with still water. A card: "One reset doesn't erase 12 days. Pick one thing to change tonight." with three tappable suggestions (Phone out of the bedroom, Ride it out earlier, Tell your ally).

S1 Get support now: plain list — "Tele-MANAS (India), free, 24/7: 14416 or 1-800-891-4416", "988 Suicide & Crisis Lifeline (US): call or text 988", "Samaritans (UK): 116 123", "Elsewhere: findahelpline.com". Each row is a tappable tel: or link. Calm, no imagery.
```

---

## Brief B5 — War Chest (the money commitment)

```
Design the War Chest flow. It follows the free pledge from onboarding (the small first yes) and is offered exactly once, the first time the user holds a day. Tone: calm, plain, adult; this is a promise to yourself, not a bet.

W1 Offer sheet (medium detent, shown once ever)
   Title: "Back your pledge?"
   Body: "Put an amount behind it. Each reset sends a quarter to a cause you pick. Make it to Mon 30 November and whatever's left comes back to you."
   Second line: "WillWar never keeps any of it."
   Primary: "Set up my War Chest". Plain, equal width: "Not now".
   Footnote: "We'll only ask once. You'll find it in Me if you change your mind."

W2 Amount
   Title: "How much?"
   Chips: ₹99, ₹199, ₹499, ₹999, Custom (₹49–₹5,000). US variant: $2, $5, $10, $20, Custom ($2–$100). Nothing pre-selected; Continue is disabled until a choice is made.
   Helper: "Pick an amount you'd notice, not one that would hurt."

W3 Rule
   Two cells:
   Steady (Recommended) — "Each reset sends 25% to your cause. One slip doesn't end it."
   Strict — "Your first reset sends all of it."

W4 Cause
   Inset list of vetted causes for the user's country, each with a one-line description and a link icon. Footnote: "We donate forfeits each month and publish the receipts."

W5 Review
   Summary cells: Amount, Rule, Cause, "Comes back on Tue 1 Dec" (the day after the challenge ends).
   Plain statements, one per line:
   "Honor system. Nobody can check this but you."
   "Changed your mind? Cancel within 24 hours for a full refund."
   "Money tight later? Contact support and we'll return what's left."
   Primary: "Pay ₹499 into my War Chest" (stake mode) or "Make my promise" (promise mode).
   Razorpay checkout appears as a system sheet over this screen.

W6 Confirmed
   HUD "War Chest set: ₹499." The chest card settles into place. Body: "It's yours again on Tue 1 Dec if you keep going." Primary "Back to Today".

W7 War Chest detail (from Me or the Today cell)
   Chest card; a timeline of events in plain sentences ("Paid ₹499 on Sun 1 Nov", "₹125 went to [cause] on Fri 6 Nov"); end date; cause with link; "Show a Backed badge to my pacts" toggle (off by default); "Cancel my War Chest" (only within 24 hours of paying, destructive style in a confirmation sheet); "Need it back early? Contact support" link.

W8 After a reset (Today)
   Below "Day 1 starts now.", the chest card shows the new split and one line: "₹375 is still yours. Keep going and it comes back on Tue 1 Dec." No red, no loss language.

W9 Challenge complete (the end moment)
   Full-screen Day 30 celebration with the Tide full and a brass ring (milestone). Then: "₹375 is on its way back to you. It usually reaches your account in 5–7 working days." and, if anything was forfeited, "₹125 went to [cause]. Thank you." Primary "Start another 30 days", plain "Not now".

W10 Promise mode (no money moves; launch default)
   Same flow, but W5's button is "Make my promise" and W8 shows: "You promised ₹125 to [cause] for this reset." with a plain "Donate now" link to the cause's own page. Nothing is tracked about whether they donate.

Every screen: one-handed, thumb-zone primary actions, no ads, no Pro upsell, no countdown timers.
```

---

## Brief C — Motion and micro-interactions

```
Add motion to the approved landing and app screens, following DESIGN.md section 7 exactly. References: motionin.design for the landing scroll sequence, 60fps.design for the app micro-interactions.

LANDING
1. Hero: the clock starts ticking on load; the phone rises 16px and fades in once with spring.ui. No other entrance animations on the page.
2. Scroll through your 30 days: scroll position maps to Day 0–30 (CSS scroll-driven animation where supported, JS fallback). Water level follows with spring.tide; captions cross-fade at the six caption days; each milestone tick turns brass with a single glint.
3. Hold to ride a wave: pointer or Space held → amplitude rises over 3s to a crest, falls over 3s; release early → the wave holds, then settles over 1s. Completion → the line flattens and "Wave passed." fades in.

APP
4. Tab switches: 200ms cross-fade via View Transitions.
5. Large title collapses into the inline title on scroll; the nav bar gains glass and a hairline.
6. Check-in: button → check morph, water rises one day, minute digit rolls (600ms).
7. Milestone: brass ring draws around the clock, one glint (1.2s, once per day).
8. Ride it out: the Tide expands to full screen (450ms shared element).
9. Wave passed: crest flattens to a calm line; HUD toast "Wave passed."
10. Sheets: spring.sheet in, drag to dismiss with velocity.
11. Reset: plain 300ms fade, no draining spectacle.
12. Tide ambient waves: two layers at 9s and 13s cycles; pause when hidden; settle after 20s idle.
13. Hold to sign: the capsule fills over 3s (linear fill, spring on completion); the handle writes itself under the pledge in 600ms.
14. War Chest bar: after a reset the split animates over 400ms with spring.tide. No shaking, no flashing, no coin effects.

For every item, show the reduced-motion version. Animate transform and opacity only. Target 60fps on a mid-range Android phone.
```

---

## Brief D — Brand assets

```
Produce WillWar's brand assets using DESIGN.md.

1. App icon: 1024×1024 master. A "W" drawn as two white wave crests side by side, on the water gradient (--tide → --tide-deep). No other text. Variants: iOS (no transparency, no rounded corners baked in), Android maskable (keep the mark inside the central 80%), Android monochrome (single-color glyph), favicon (32px and SVG).
2. iOS launch screens: --tide-deep background with the mark centered, for 393×852, 430×932 and 375×667 at @3x and @2x.
3. Open Graph image 1200×630: "Make it to December." with the phone showing the Tide; off-season variant "Thirty days. Starting tonight."
4. Share cards (the user's own progress), 1080×1920 and 1080×1080: a large rounded "Day 17" with "of 30" smaller, the Tide at that level, a small wordmark. Toggles: show handle (off by default), show challenge name (off by default, so the card can be shared discreetly).
5. Empty-state illustrations: calm sea line, two wave lines moving in step (pacts), a small vault resting on calm water (War Chest), a single wave (Ride it out), a horizon at dawn (Day 30).
```

---

## Critique prompt (run after every brief)

```
Critique the current output against the WillWar DESIGN.md and Block 0. Answer each point with pass or fix, then apply the fixes:
1. Is the Tide (or the scroll-through-30-days sequence on the landing) the only bold element? Name anything competing with it.
2. Does any part fall into a generic default: cream + serif + terracotta, near-black + acid green, newspaper hairlines, identical rounded cards with grey shadows, all-caps eyebrows, middle-dot metadata, monospace data labels, arrows on buttons, numbered markers on non-sequences?
3. Copy: does every button say exactly what happens, and does each action keep its name through to its confirmation? Any invented numbers, testimonials or health claims?
4. Contrast AA, 44pt targets, visible focus, reduced-motion version present?
5. Are Ride it out and I held today reachable with one thumb?
6. Are empty, loading, offline and error states designed?
7. Peak (milestone, wave passed) and end (day summary, Day 30) moments designed with care? Reset designed without shame?
8. Anything sexual, body-related, or not discreet on a lock screen or share card?
9. Ads or paywalls anywhere between a person and Ride it out?
10. War Chest: offered once, nothing pre-selected, "Not now" as clear as the primary button, honor system and refund terms stated, no loss language, never near Ride it out, ads or the paywall?
11. Remove one decorative element. Say which.
```

---

## Inspiration map

| Site | Use it for | Don't |
|---|---|---|
| godly.website | The ambition bar for the landing page's single orchestrated moment | Copy a layout wholesale |
| landdding.com | Section pacing, CTA placement, pricing and FAQ patterns | Borrow template chrome (eyebrows, stat strips) |
| motionin.design | Scroll-driven hero and the 30-day sequence | Add motion to every section |
| 60fps.design | Check-in morph, sheet physics, tab transitions, game feedback | Animate seconds or ambient decoration |
| wonderlist.design | Onboarding, paywall and settings structures from complete app files | Lift a visual style |
| iconly.design | Optional icon set if you buy a commercial license (otherwise Phosphor) | Mix icon families |
| fontinlogo.com | Picking a licensed face for the "WillWar" wordmark only | Use the wordmark face as UI text |
| footer.design | The landing footer layout | Overload the footer |
| backgrounds.supply | Optional subtle water texture behind the desktop app column | Use anything not licensed for commercial use |
| recent.design | A last check that nothing reads as dated | Chase trends over the brief |
| on.design | Posting the landing for feedback from designers before launch | Expect feedback to replace your critique pass |
| modulify.ai | Quick throwaway landing variants to A/B test headlines | Ship it as the production site (the build is Next.js) |

---

## Handoff to VS Code

Export into the repo at `design/exports/`:

| File | Contents |
|---|---|
| `landing.html` + `landing-*.png` | Brief A, including off-season and reduced-motion frames |
| `app-onboarding.html` + PNGs | Brief B1 |
| `app-today-urge.html` + PNGs | Brief B2 |
| `app-pact.html` + PNGs | Brief B3 |
| `app-learn-me-reset.html` + PNGs | Brief B4 |
| `app-war-chest.html` + PNGs | Brief B5 |
| `motion-notes.md` | Brief C timings, as Open Design wrote them |
| `brand/` | Brief D assets (SVG master icon, PNG sizes, OG, share card templates) |

The build prompt tells the coding agent to treat these exports as visual references and `DESIGN.md` as the source of truth for values. If an export and `DESIGN.md` disagree, `DESIGN.md` wins; fix the export or update `DESIGN.md` deliberately.
