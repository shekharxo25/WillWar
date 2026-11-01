import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": src } },
  test: {
    projects: [
      {
        resolve: { alias: { "@": src } },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
        },
      },
      {
        resolve: { alias: { "@": src } },
        test: {
          name: "eval",
          environment: "node",
          include: ["scripts/eval/**/*.eval.ts"],
          testTimeout: 60_000,
        },
      },
      {
        resolve: { alias: { "@": src } },
        test: {
          name: "db",
          environment: "node",
          include: ["supabase/tests/pglite/**/*.test.ts"],
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
