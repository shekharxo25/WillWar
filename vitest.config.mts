import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "supabase/tests/**/*.test.ts", "scripts/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
