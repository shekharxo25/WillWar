# Guardrail: design implementation

`docs/design/DESIGN.md` is the source of truth for every visual value. `design/exports/` holds Open Design references; when they disagree with DESIGN.md, DESIGN.md wins. This file covers how to implement it.

## Tokens

- `src/styles/tokens.css` declares every DESIGN.md token on `:root` (light) and under `@media (prefers-color-scheme: dark)` plus `[data-theme="dark"]` (manual override from Settings).
- Tailwind v4 `@theme` maps tokens to utilities (`bg-grouped`, `text-label-2`, `bg-tide`, `text-brass-ink`...). No raw hex values in components; a lint rule (or a grep in CI) fails on `#[0-9a-fA-F]{3,8}` outside `tokens.css` and brand assets.
- Spacing uses the 8-point scale only. Radii: 8, 12, 14 (buttons), 16, 22, full.

## Licensing (hard rules)

| Asset | Rule |
|---|---|
| SF Pro, SF Compact, New York fonts | Never self-host, embed or link. Apple's license limits them to mock-ups for Apple-platform software. Use `system-ui` / `-apple-system`, which renders SF Pro on Apple devices legally. |
| SF Symbols | Never use, trace or export. Licensed for Apple-platform apps only. |
| Icons | `@phosphor-icons/react` (MIT). Iconly Pro only with a purchased commercial license on file in `docs/licenses/`. |
| Numerals font | Nunito subset (SIL OFL), self-hosted as "WillWar Digits"; keep the OFL text in `docs/licenses/`. |
| Wordmark | SVG outlines from a face licensed for logo use; license in `docs/licenses/`. |
| Backgrounds and textures | Only with a commercial license on file. |
| Device frames on the landing | Generic phone frame; no Apple logo or trade dress. |

## Apple design language on the web

- **Typography:** `font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Numerals: `font-family: ui-rounded, "WillWar Digits", system-ui; font-variant-numeric: tabular-nums;`. Sizes in `rem` so user font scaling works.
- **Materials:** the `.glass` recipe in DESIGN.md section 4, only on floating chrome. Provide the `prefers-reduced-transparency` fallback. No SVG refraction filters.
- **Navigation:** large title collapsing on scroll (IntersectionObserver on a sentinel), floating capsule tab bar, Ride it out pill.
- **Sheets:** Radix Dialog for focus management, Motion for drag-to-dismiss and detents, `role="dialog"` with a labelled title.
- **Lists:** inset grouped cells with 0.5px separators (`border-bottom: 0.5px solid var(--separator)`; fall back to 1px where 0.5px renders as 0).
- **Segmented control:** Radix ToggleGroup, single selection, arrow-key navigation.
- **Concentric radii:** inner radius = outer radius − padding.
- **Feedback:** pressed states on every tappable (scale 0.97, opacity 0.85, 120ms). The web can't trigger haptics on iOS; don't promise them.

## Motion

- Motion library springs from DESIGN.md: `spring.ui`, `spring.sheet`, `spring.tide`.
- View Transitions API for tab and route changes where supported; instant swap otherwise.
- Animate `transform` and `opacity` only. Canvas for the Tide and games.
- `useReducedMotion()` gates every animation; the reduced version is designed, not merely disabled.
- The Tide pauses on `visibilitychange` and settles after 20 seconds idle to save battery.

## Accessibility

- Contrast: AA for text (4.5:1, 3:1 for 18pt+ or 14pt bold). Brass is never used for small text on light backgrounds; use `--brass-ink`.
- Targets: at least 44×44 CSS px, with 8px between adjacent targets.
- Focus: visible 2px `--tide` outline with 2px offset on every interactive element.
- Screen readers: the clock has an `aria-label` that updates each minute ("12 days, 4 hours, 31 minutes"), not every second. The Tide canvas is `aria-hidden` with a text equivalent. Games expose a text summary and a pause control.
- Forms: visible labels, errors tied with `aria-describedby`, input font size at least 16px.

## Copy

Use the verb dictionary in DESIGN.md section 9. An action keeps its name from button to confirmation. Errors say what happened and how to fix it. Empty states invite one action. No invented numbers; bracketed placeholders until real data exists.

## Generic defaults to avoid

Cream background with serif display and terracotta accent; near-black with acid green; newspaper hairline layouts; grids of identical rounded cards with grey shadows; all-caps eyebrow labels; middle-dot metadata strings; monospace data labels; "→" appended to buttons; numbered markers on things that aren't sequences; fade-and-slide entrances on every section.

## Component checklist (every new component)

- [ ] Values from tokens only
- [ ] Light and dark verified
- [ ] Default, pressed, focus, disabled states
- [ ] Empty, loading (skeleton), offline and error states where data is involved
- [ ] Reduced-motion version
- [ ] 44pt targets, AA contrast, labelled for screen readers
- [ ] Checked at 375×667 and 393×852
- [ ] One decorative element removed before merge
