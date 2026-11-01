import { defineConfig } from "vitest/config";
import path from "node:path";

/** Config for `npm run eval:ai` only (kept out of the unit test run so CI never calls the API by accident). */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "../src") } },
  test: {
    root: path.resolve(import.meta.dirname, ".."),
    environment: "node",
    include: ["scripts/eval-ai.ts"],
    testTimeout: 30000,
    reporters: ["verbose"],
  },
});
