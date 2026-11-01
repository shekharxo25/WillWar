#!/usr/bin/env node
// Stamps public/sw.js with a release version so clients drop old caches.
// Usage: node scripts/stamp-sw.mjs [version]   (default: git short SHA, else a timestamp)
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

let version = process.argv[2];
if (!version) {
  try {
    version = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    version = Date.now().toString(36);
  }
}
const file = new URL("../public/sw.js", import.meta.url);
const src = readFileSync(file, "utf8");
const next = src.replace(/const VERSION = "[^"]*";/, `const VERSION = "${version}";`);
writeFileSync(file, next);
console.log(`sw.js VERSION = ${version}`);
