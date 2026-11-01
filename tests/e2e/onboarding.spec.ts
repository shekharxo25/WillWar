import { expect, test } from "@playwright/test";

test("under-18 is blocked and nothing is stored", async ({ page }) => {
  await page.goto("/app/start");
  await page.getByRole("listbox", { name: "Year" }).focus();
  // Move the year wheel to a recent year (list runs newest first).
  for (let i = 0; i < 2; i++) await page.keyboard.press("ArrowUp");
  await page.getByRole("option", { name: String(new Date().getFullYear() - 10) }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("WillWar is for people 18 and over.")).toBeVisible();
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("ww.device")));
  expect(stored).toEqual([]);
});

test("full onboarding creates a device record and opens Today", async ({ page }) => {
  await page.goto("/app/start");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /30 days from today/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Focus" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: /^Steady/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("handle").fill("e2e_runner");
  await expect(page.getByText("Available.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Save on this phone/ }).click();
  await page.getByRole("button", { name: "Not now" }).click();
  await page.getByRole("button", { name: /Continue with Free/ }).click();
  await expect(page).toHaveURL(/\/app\/today/);
  const raw = await page.evaluate(() => localStorage.getItem("ww.device.v1"));
  expect(raw).toContain("e2e_runner");
  expect(raw).not.toMatch(/birth/i);
  // Check-in is idempotent.
  await page.getByRole("button", { name: "I held today" }).click();
  await expect(page.getByRole("button", { name: /Day 1 held\./ })).toBeDisabled();
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem("ww.device.v1")!).checkins.length);
  expect(count).toBe(1);
});
