// Interaction checks for the landing page: chalk scroll, hold-to-last demo (mouse, touch, Space), no-JS render.
// Usage: node scripts/check-landing.mjs [baseUrl] (server must be running)
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import assert from "node:assert";

(async () => {
  const base = process.argv[2] || "http://localhost:3101";
  const out = path.join(__dirname, "..", "docs", "screenshots");
  const b = await chromium.launch();

  // Desktop: chalk scroll draws strokes as you scroll.
  const d = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  await d.goto(`${base}/`, { waitUntil: "networkidle" });
  const track = d.locator(".chalk-sticky");
  const box = await track.boundingBox();
  const top = await d.evaluate((y) => y + window.scrollY, box.y);
  await d.evaluate(([t, h]) => window.scrollTo(0, t + (h - window.innerHeight) * 0.5), [top, box.height]);
  await d.waitForTimeout(600);
  const mid = await d.locator(".chalk-sticky [aria-live]").innerText();
  assert.match(mid, /DAY 14/, `expected DAY 14 caption at the midpoint, got ${mid}`);
  await d.screenshot({ path: `${out}/landing-desktop-chalk-mid.png` });
  await d.evaluate(([t, h]) => window.scrollTo(0, t + h - window.innerHeight - 2), [top, box.height]);
  await d.waitForTimeout(600);
  assert.match(await d.locator(".chalk-sticky [aria-live]").innerText(), /DAY 30/);
  await d.screenshot({ path: `${out}/landing-desktop-chalk-end.png` });

  // Hold demo with the mouse: releasing pauses, holding to the end shows the line.
  const btn = d.getByRole("button", { name: "Hold to last a 10-second round" });
  await btn.scrollIntoViewIfNeeded();
  await btn.hover();
  await d.mouse.down();
  await d.waitForTimeout(2200);
  await d.mouse.up();
  const paused = await d.getByRole("timer", { name: /seconds left/ }).getAttribute("aria-label");
  await d.waitForTimeout(800);
  assert.equal(await d.getByRole("timer", { name: /seconds left/ }).getAttribute("aria-label"), paused, "release pauses");
  // Finish with the Space key.
  await btn.focus();
  await d.keyboard.down("Space");
  await d.waitForTimeout(8600);
  await d.keyboard.up("Space");
  await d.getByText("You went the distance.").waitFor({ timeout: 2000 });
  await d.screenshot({ path: `${out}/landing-desktop-hold-done.png` });
  console.log("desktop: chalk scroll and hold demo (mouse + Space) ok");

  // Touch on a phone.
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const m = await ctx.newPage();
  await m.goto(`${base}/`, { waitUntil: "networkidle" });
  const mb = m.getByRole("button", { name: "Hold to last a 10-second round" });
  await mb.scrollIntoViewIfNeeded();
  const r = await mb.boundingBox();
  const cdp = await ctx.newCDPSession(m);
  const pt = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] });
  await m.waitForTimeout(10600);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await m.getByText("You went the distance.").waitFor({ timeout: 2000 });
  console.log("mobile: touch hold ok");

  // No JavaScript: core content renders.
  const nj = await b.newContext({ javaScriptEnabled: false, viewport: { width: 393, height: 852 } });
  const n = await nj.newPage();
  await n.goto(`${base}/`);
  for (const t of ["THE URGE", "Start my 30 days", "Thirty days, chalked on the wall.", "Is WillWar for under-18s?", "Day 9. Phone out of the bedroom tonight. That's the game plan."]) {
    assert.ok((await n.getByText(t, { exact: false }).count()) > 0, `no-JS missing: ${t}`);
  }
  assert.ok(await n.getByText("No. WillWar is for adults only.").count(), "FAQ answers present without JS");
  console.log("no-JS: core content ok");

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
