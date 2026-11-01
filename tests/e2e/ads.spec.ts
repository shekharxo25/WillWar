import { expect, test } from "@playwright/test";

/** Crawl every route as a free user; fail if an ad script/iframe or a sponsored unit shows outside the allowlist (Part 7.5). */
const ROUTES = ["/", "/privacy", "/terms", "/health", "/support", "/learn", "/app/start", "/app/today", "/app/round", "/app/camp", "/app/me", "/app/settings", "/app/pro", "/app/war-chest", "/app/learn"];
const ALLOWED_SPONSORED = new Set(["/learn", "/app/learn", "/app/me"]);

test("ads only on allowlisted placements", async ({ page }) => {
  await page.goto("/app/start");
  await page.evaluate(() => {
    const now = new Date().toISOString();
    localStorage.setItem("ww.device.v1", JSON.stringify({
      version: 1,
      profile: { id: "u1", handle: "free_user", avatarSeed: "abc123", timezone: "Asia/Kolkata", tone: "steady", whyTags: ["focus"], discreetNotifications: true, leaderboardVisibility: "camps", showBackedBadge: false, warChestOfferedAt: null, createdAt: now, country: "IN" },
      streaks: [{ id: "s1", startedAt: now, endedAt: null }], checkins: [], resets: [], urgeSessions: [],
      goal: { id: "g1", seasonId: null, startDate: now.slice(0, 10), endsOn: "2027-12-31", pledgeSignedAt: null, createdAt: now, closedAt: null },
      shields: [], entitlement: null, warChest: null, warChestEvents: [], camps: [], challenges: [], nudges: [], events: [],
    }));
  });
  for (const r of ROUTES) {
    await page.goto(r);
    await page.waitForTimeout(400);
    const external = await page.evaluate(() =>
      [...document.querySelectorAll("script[src], iframe[src]")].map((e) => (e as HTMLScriptElement).src).filter((s) => /googlesyndication|doubleclick|adsbygoogle|h5games/.test(s)),
    );
    expect(external, `ad script on ${r}`).toEqual([]);
    if (!ALLOWED_SPONSORED.has(r)) {
      await expect(page.getByText("Sponsored", { exact: true }), `sponsored unit on ${r}`).toHaveCount(0);
    }
  }
});
