import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Cache Components is off: on Cloudflare Workers its setTimeout-based scheduling hangs page renders
  // (docs/DECISIONS.md, 2026-11-01 "Cache Components off for Workers").
  cacheComponents: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Learn articles live in content/learn/*.mdx and are imported by src/lib/learn/articles.ts.
const withMDX = createMDX({});

export default withMDX(nextConfig);
