# Guardrail: PWA native feel

The goal: once installed, WillWar is indistinguishable from a native iOS or Android app in the moments that matter (launch, navigation, check-in, Ride it out).

## Platform facts that shape the design

- **iOS install is manual.** Safari has no install prompt and no `beforeinstallprompt`; users add the site from the Share menu. Since iOS 26, every site added to the Home Screen opens as a web app by default, which removes one failure point.
- **iOS push requires installation.** Web Push works on iOS 16.4+ only for Home Screen web apps, and permission can only be requested from a user tap inside the installed app.
- **iOS has no Background Sync** (or Periodic Background Sync, Web Share Target, Bluetooth, NFC). Sync when the app opens or regains focus.
- **Installed web apps keep their data.** WebKit skips Home Screen apps when it clears website data, so installation also protects the on-device journal and offline queue.
- **Android Chrome** supports install prompts, manifest shortcuts, maskable and monochrome icons.

## Manifest (`app/manifest.ts`)

```ts
{
  id: "/app/",
  name: "WillWar",
  short_name: "WillWar",                     // discreet on the home screen
  description: "A 30-day streak tracker.",
  start_url: "/app/today?source=pwa",
  scope: "/app/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#000000",
  theme_color: "#0B6E7F",
  icons: [192, 512 (any), 512 (maskable), monochrome],
  shortcuts: [{ name: "Ride it out", url: "/app/urge" }]   // Android only
}
```

Scope is `/app/` so marketing pages open in the browser and the app stays app-like. The auth callback lives inside the scope (`/app/auth/callback`).

## iOS head tags

`apple-touch-icon` (180×180, no transparency), `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title: WillWar`, launch images (`apple-touch-startup-image`) for current iPhone sizes, `viewport` with `viewport-fit=cover`, and `theme-color` per color scheme.

## Layout

- `env(safe-area-inset-*)` on the top bar, tab bar, pill and full-screen games.
- Use `100dvh`, never `100vh`.
- `overscroll-behavior: none` on the app shell (no rubber-band reveals of the page behind).
- `-webkit-tap-highlight-color: transparent`; custom pressed states instead.
- `touch-action: manipulation` to drop double-tap zoom delay.
- Inputs at least 16px so iOS doesn't zoom.
- Handle the keyboard with `visualViewport` so sheets with inputs stay visible.
- `user-select: none` and `-webkit-touch-callout: none` on chrome and game canvases only, never on article text.
- No hover-only interactions.

## Install coach

- Detect standalone with `matchMedia('(display-mode: standalone)')` or `navigator.standalone`.
- iOS Safari, not installed: three illustrated steps (Share → Add to Home Screen → open WillWar). Show during onboarding and as a dismissible cell on Today; don't nag more than once every 3 days.
- iOS in another browser: tell the user to open the site in Safari to install.
- Android: capture `beforeinstallprompt`, show "Install WillWar" from a user tap.
- Measure: install rate is a core metric, because push and storage durability depend on it.

## Authentication inside the installed app

Magic links open in Safari, not in the installed app, so the session lands in the wrong place. Use one-time email codes as the primary sign-in. Test Google OAuth inside the installed iOS app before relying on it, and recommend users sign in before installing if it misbehaves.

## Offline

- The clock is computed from `started_at` on the device and works offline.
- Check-ins and urge sessions queue in IndexedDB and sync on load, focus, `online` and `visibilitychange`; the server's answer wins conflicts.
- Request `navigator.storage.persist()` after install.
- Service worker: precache the shell and `/app/offline`; NetworkFirst for app pages; never cache `/api/*` or anything user-specific in shared caches.
- Show "Offline. Your clock keeps running; check-ins sync when you're back." instead of errors.

## Native touches worth doing

- **App badge:** `navigator.setAppBadge(1)` when today's check-in is pending; clear on check-in.
- **Screen Wake Lock** during urge games so the screen doesn't dim mid-game.
- **Web Share API** for invites and share cards, with copy-link fallback.
- **View Transitions** for tab and route changes.
- **Theme color** matches the current screen's top surface.
- **Vibration** works on Android only; never rely on it.

## Push

- Ask only after a meaningful moment (first check-in) and only from a tap; on iOS only when standalone.
- Discreet copy by default ("WillWar · Day 12. Tap to check in.").
- Quiet hours 23:00–07:00 local, except opt-in Night watch.
- Clean up subscriptions on 404 or 410.

## Test matrix (before each release)

| Device | Browser | Checks |
|---|---|---|
| iPhone (current iOS) | Safari → installed | Install, launch, safe areas, code sign-in, push, offline, badge |
| iPhone SE size | Safari → installed | Layout at 375×667 |
| Mid-range Android | Chrome → installed | Install prompt, shortcut, 60fps games, push, offline |
| Desktop | Chrome, Safari | Landing, centered app column, keyboard access |
