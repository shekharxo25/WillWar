// Writes supabase/apply-all.sql: every migration in order plus the seed, for one paste
// into the Supabase SQL editor when the CLI or a database URL isn't available.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../supabase/migrations/", import.meta.url);
const parts = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => `-- ===== ${f} =====\n${readFileSync(new URL(f, dir), "utf8")}`);
parts.push(`-- ===== seed.sql =====\n${readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8")}`);
writeFileSync(new URL("../supabase/apply-all.sql", import.meta.url), parts.join("\n\n"));
console.log(`supabase/apply-all.sql written (${parts.length} parts)`);
