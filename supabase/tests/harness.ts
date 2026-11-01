/**
 * In-process Postgres for database tests (no Docker). PGlite + Supabase-style stubs:
 * roles, the auth schema with auth.uid(), and Supabase's default grants on schema public.
 * Then every migration in order, then seed.sql.
 */
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

export const SUPABASE_STUBS = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema auth;
create table auth.users (
  id uuid primary key,
  instance_id uuid,
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json->>'sub', '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Supabase's default grants on schema public
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export function migrationFiles(): string[] {
  const dir = path.join(ROOT, "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => path.join(dir, f));
}

export async function freshDb(opts: { seed?: boolean } = {}): Promise<PGlite> {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  for (const f of migrationFiles()) {
    try {
      await db.exec(readFileSync(f, "utf8"));
    } catch (e) {
      throw new Error(`${path.basename(f)}: ${(e as Error).message}`);
    }
  }
  if (opts.seed !== false) await db.exec(readFileSync(path.join(ROOT, "seed.sql"), "utf8"));
  return db;
}

export type Tx = Transaction;

/** Run fn as a signed-in user (role authenticated, JWT sub = uid). Rolls back if rollback=true. */
export async function asUser<T>(db: PGlite, uid: string | null, fn: (tx: Tx) => Promise<T>, role = "authenticated"): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    if (uid) await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role })]);
    return fn(tx);
  });
}

export const asAnon = <T>(db: PGlite, fn: (tx: Tx) => Promise<T>) => asUser(db, null, fn, "anon");
export const asService = <T>(db: PGlite, fn: (tx: Tx) => Promise<T>) => asUser(db, null, fn, "service_role");

/** Returns the error message (or "ok") of running fn in its own transaction. */
export async function errorOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "ok";
  } catch (e) {
    return (e as Error).message;
  }
}

let n = 0;
export function newId(): string {
  n++;
  return `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Inserts an auth user as superuser and returns its id. */
export async function authUser(db: PGlite, id = newId()): Promise<string> {
  await db.query(`insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')`, [id, `${id}@test.local`]);
  return id;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Picks a zone where the local hour right now is between 8 and 20, so tests that depend on
 * "waking hours" are deterministic whatever time the suite runs.
 */
export function daytimeZone(now = new Date()): string {
  const zones = ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo", "Pacific/Auckland", "America/Los_Angeles"];
  for (const tz of zones) {
    const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
    if (h >= 8 && h <= 20) return tz;
  }
  return "Asia/Kolkata";
}

export function localToday(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, k: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + k)).toISOString().slice(0, 10);
}

/** Onboards a user through complete_onboarding with a custom end date (robust to the run date). */
export async function onboard(
  db: PGlite,
  opts: { handle: string; tz?: string; endsInDays?: number; pledge?: boolean; id?: string; visibility?: "private" | "camps" | "global" },
): Promise<string> {
  const id = await authUser(db, opts.id);
  const tz = opts.tz ?? "Asia/Kolkata";
  const ends = addDays(localToday(tz), opts.endsInDays ?? 20);
  await asUser(db, id, async (tx) => {
    await tx.query(`select public.complete_onboarding($1, $2, $3, 'steady', '{focus}', null, $4, now())`, [opts.handle, "1990-01-01", tz, ends]);
    if (opts.pledge) await tx.exec(`select public.sign_pledge()`);
    if (opts.visibility) await tx.query(`update public.profiles set leaderboard_visibility = $1 where id = $2`, [opts.visibility, id]);
  });
  return id;
}
