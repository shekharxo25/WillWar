import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, timezoneId: "Asia/Kolkata", launchOptions: process.env.CI ? {} : { executablePath: undefined } },
  webServer: { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "iphone-15", use: { ...devices["iPhone 15"], browserName: "chromium" } },
    { name: "pixel-8", use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } } },
  ],
});
