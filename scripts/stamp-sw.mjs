// Writes public/sw.js from scripts/sw.template.js with a build-time revision, so each
// deploy gets fresh caches. No child_process at runtime: this runs before the build.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

let revision = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "";
if (!revision) {
  try {
    revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    revision = "";
  }
}
revision = `${(revision || "dev").slice(0, 12)}-${Date.now().toString(36)}`;

const template = readFileSync(new URL("./sw.template.js", import.meta.url), "utf8");
writeFileSync(new URL("../public/sw.js", import.meta.url), template.replace("__SW_VERSION__", revision));
console.log(`sw.js stamped: ${revision}`);
