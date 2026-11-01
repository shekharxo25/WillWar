// In-process Postgres (PGlite) with Supabase-like roles, grants and an auth schema, so
// the real migrations can be tested without Docker. CI also runs the pgTAP files with
// `supabase test db`; this harness is the local equivalent for `npm run db:test:local`.
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  create schema extensions;
  create extension pgcrypto schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Supabase's defaults: new tables, functions and sequences are granted to the API roles;
  -- RLS and the migrations' explicit revokes are what actually protect data.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export async function createDb(): Promise<PGlite> {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  const dir = join(ROOT, "migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  await db.exec(readFileSync(join(ROOT, "seed.sql"), "utf8"));
  return db;
}

export async function addUser(db: PGlite, id: string): Promise<void> {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, `${id.slice(0, 8)}@example.test`]);
}

/** Runs `fn` as an authenticated Supabase user (role + JWT claims), rolled back afterwards. */
export async function asUser<T>(db: PGlite, uid: string, fn: (tx: Transaction) => Promise<T>, commit = true): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${uid}"}', true);`);
    const result = await fn(tx);
    if (!commit) await tx.rollback();
    return result;
  });
}

export async function asAnon<T>(db: PGlite, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role anon; select set_config('request.jwt.claims', '{}', true);`);
    return fn(tx);
  });
}

/** Expects a statement to raise; returns the error message. */
export async function raises(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error("expected an exception");
}

export const onboard = (tx: Transaction, handle: string, birth = "1999-05-05") =>
  tx.query(
    `select public.complete_onboarding($1, $2::date, 'Asia/Kolkata', 'steady', array['focus'], null,
       ((now() at time zone 'Asia/Kolkata')::date + 29), now() - interval '1 hour', null)`,
    [handle, birth],
  );
