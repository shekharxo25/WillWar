// Screenshots of the landing page at iPhone 15 and desktop sizes.
// Usage: node scripts/screenshot-landing.mjs [baseUrl] (server must be running)
import { chromium } from "playwright";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const base = process.argv[2] || "http://localhost:3101";
  const out = path.join(__dirname, "..", "docs", "screenshots");
  mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (const [name, w, h, mobile, scheme] of [
    ["mobile", 393, 852, true, "dark"],
    ["desktop", 1440, 900, false, "dark"],
    ["mobile-light", 393, 852, true, "light"],
    ["desktop-light", 1440, 900, false, "light"],
  ]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: scheme });
    await p.goto(`${base}/`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${out}/landing-${name}.png` });
    await p.screenshot({ path: `${out}/landing-${name}-full.png`, fullPage: true });
    await p.close();
  }
  await b.close();
})();
