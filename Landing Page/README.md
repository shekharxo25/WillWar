# WillWar Interactive Landing Page

This folder contains the complete, interactive landing page for the **WillWar Project**, implemented directly from the **Google Stitch MCP** project (`projects/14559867955947162712`, screen `WillWar - Responsive Landing Page`) and strictly adhering to the design system in `docs/design/DESIGN.md` and repo guidelines in `AGENTS.md`.

---

## 🎨 Design & Motion Inspirations

The landing page incorporates patterns, motion curves, and layout principles from the curated inspiration index:

1. **[modulify.ai](http://modulify.ai)** — Modular component architecture: Inset grouped cards, cognitive load exercise switcher, and self-contained interactive modules.
2. **[landdding.com](http://landdding.com)** — High-converting landing architecture: Clear chronological storytelling, progressive disclosure, and friction-free commitments.
3. **[motionin.design](http://motionin.design)** — Fluid kinetic rhythm and subtle transitions across all interactive elements.
4. **[wonderlist.design](http://wonderlist.design)** — Figma-grade design precision: Concentric corner radii (`inner = outer - padding`), strict 8-point spatial cadence, and AA contrast.
5. **[iconly.design](http://iconly.design)** — Optical balance, minimal nautical glyphs, and Phosphor icon integration.
6. **[fontinlogo.com](http://fontinlogo.com)** — Editorial typography pairing: Characterful **Epilogue** display font paired with clinical **Geist** telemetry.
7. **[on.design](http://on.design)** — Design decorum: Adult composure, clinical terminology, sentence casing, and zero hyperbole/gym-bro tropes.
8. **[godly.website](http://godly.website)** — Award-winning visual craft: Floating Apple Liquid Glass header, sticky radial horizon chronometer on desktop, and instant dark/light theme switching.
9. **[60fps.design](http://60fps.design)** — 60fps spring physics: Tactile button press states (`scale 0.97, opacity 0.88`), dual sine wave canvas engine (`spring.tide` stiffness 120, damping 20), and smooth scrubber transitions.
10. **[footer.design](http://footer.design)** — Architectural footer: Multi-column structure with real-time telemetry badge (`Tide Engine v2.4 • Local Device Storage • Off-Season Active`), legal clarity, and 18+ adult disclaimers.
11. **[recent.design](http://recent.design)** — Tactile micro-interactions: Interactive "Hold to ride a wave" buffer with live wave compression, and 3-second "Hold to sign" pledge drawer with spacebar trigger.
12. **[backgrounds.supply](http://backgrounds.supply)** — Atmospheric subsurface marine lighting: Subtle breathing radial glows (`ambient-glow-1`, `ambient-glow-2`) simulating deep ocean light without CPU/battery cost.

---

## 📂 Architecture & Directory Structure

```
Landing Page/
├── index.html                   # Master standalone interactive landing page (opens in any browser)
├── README.md                    # This documentation file
├── css/
│   ├── tokens.css               # Exact design tokens from DESIGN.md (Tide, Brass, Liquid Glass, light/dark)
│   └── styles.css               # Complete responsive layout, animations, bento grids, and media queries
├── js/
│   ├── tide-canvas.js           # Living HTML5 canvas wave engine (9s/13s cycles, pointer disturbance, auto-settle)
│   ├── chronometer.js           # Live epoch-based session chronometer with tabular digits and localStorage persistence
│   ├── timeline-scrubber.js     # Interactive 30-day scrubber linking radial horizon gauge, milestone cards, and phone dial
│   ├── ride-it-out.js           # Tactile wave compression chamber, Swell breathing pacer (4s/6s), and Drift spatial puzzle
│   ├── pact-leaderboard.js      # Segmented metrics switcher (Current, Best, Days), nudges, and invite links
│   ├── war-chest.js             # Collateral calculator with dynamic 75/25 split progress bar and cause selector
│   ├── morning-line.js          # Daily calibration tone switcher with simulated voice synthesis preview
│   ├── faq-accordion.js         # Accessible spring disclosure accordion with keyboard support
│   ├── pledge-modal.js          # Interactive 3-second tactile hold-to-sign pledge drawer (mouse, touch & Spacebar)
│   └── app.js                   # Main application bootstrap, HUD toast system, and theme toggle
├── assets/
│   ├── icons/                   # Nautical & utility icon assets
│   └── backgrounds/             # Caustic gradient & ambient lighting assets
└── react/
    └── InteractiveLandingPage.tsx # Next.js 16 + React 19 + Motion + Phosphor Icons component (served at /)
```

---

## 🕹️ Interactive Features

1. **Living Tide Canvas Engine (`tide-canvas.js` & `components/tide/Tide.tsx`):**
   - Two sine layers drifting at 9s and 13s cycles over a water gradient.
   - Front layer `--tide` (`#0B6E7F`), back layer `--tide-deep` (`#0A3F55`).
   - Interactive ripples appear when interacting with the waterline.
   - Settles after 20 seconds idle to conserve power; wakes immediately on interaction.
   - Pauses rendering when document is hidden.

2. **Active Telemetry Chronometer (`chronometer.js`):**
   - Counts elapsed session time down to the second using `tabular-nums` to eliminate jitter.
   - Persists start timestamp across page reloads in `localStorage('ww-session-start')`.

3. **30-Day Interactive Timeline Scrubber (`timeline-scrubber.js`):**
   - Drag slider or click milestone cards (Day 1, Day 3, Day 7, Day 14, Day 21, Day 30).
   - In real-time updates:
     - Waterline percentage (3% → 100%).
     - Sticky radial horizon chronometer on desktop.
     - Phone mockup's Tide Depth and living water level.
     - Triggers subtle brass milestone glint and haptic vibration on milestone days (Day 7, 14, 21, 30).

4. **"Ride It Out" Cognitive Load Lab (`ride-it-out.js`):**
   - **Tactile Wave Buffer:** Hold down "Hold to ride a wave" to steadily compress the surge from 38% down to 0% over ~3 seconds. On complete, sea becomes still, status flips to *"Wave passed"*, and haptic pulse fires with a floating HUD notification. Releasing early drains the progress.
   - **Swell Breathing Pacer:** Rhythmic expanding/contracting visual ring pacing 4 seconds inhale, 6 seconds exhale for parasympathetic vagus activation.
   - **Drift Spatial Game Preview:** Interactive raft puzzle preview.

5. **Private Pacts Leaderboard (`pact-leaderboard.js`):**
   - Segmented metric toggle: **Current**, **Best**, and **Days**.
   - Anonymized handles (`@dev.s`, `@quietmile [YOU]`, `@rohan_k`, `@arjun_m [Paused]`).
   - Real-time "Nudge" actions that dispatch HUD toast notifications.
   - "+ Invite fifth friend" with instant encrypted share link copying.

6. **War Chest Commitment Contract Simulator (`war-chest.js`):**
   - Presets for ₹99, ₹199, ₹499, ₹999 or custom collateral.
   - Real-time 75% / 25% two-part split progress bar (Still yours vs Given to cause).
   - Verified 501(c)(3) recipient selection (*The Ocean Cleanup*, *GiveDirectly*, *Mental Health Crisis Line*).
   - Promise Mode toggle for honor-system commitments without monetary charge.

7. **Morning Line Tone Switcher (`morning-line.js`):**
   - Switch between **Steady** (Anchor), **Stoic** (Shield), **Coach** (Flag), and **Playful** (Sailboat).
   - Click "Audio Orientation Preview" to hear the voice line simulated via Web Speech Synthesis.

8. **Pledge Commitment Drawer (`pledge-modal.js`):**
   - Accessible by clicking any *"Start my 30 days"* CTA.
   - User inputs their anonymous pact handle.
   - Press and hold *"Hold to sign pledge"* (or hold the Spacebar) for 1.5 seconds to fill the capsule with Tide color.
   - On completion, seals the pledge with a brass badge and triggers HUD confirmation.

9. **Dark / Light Appearance Toggle:**
   - Instant toggle with system preference auto-detection and persistence in `localStorage('ww-theme')`.

---

## 🚀 How to Run and Preview

### Option A: Standalone Zero-Build Browser Run
Open `Landing Page/index.html` directly in Google Chrome, Apple Safari, Microsoft Edge, or Mozilla Firefox:
- Simply double-click `Landing Page/index.html`, or
- Use any local static server (e.g., `npx serve "Landing Page"` or `python -m http.server`).

### Option B: Next.js 16 App Server
The interactive landing page is also wired to the Next.js App Router at `src/app/page.tsx`:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the page running in Next.js with Turbopack, Framer Motion, and Phosphor Icons.

### Verification Commands
```bash
npm run typecheck    # Confirms 100% strict TypeScript compliance
npm run lint         # ESLint check
npm run test         # Vitest unit test suite (45 passing tests)
```
