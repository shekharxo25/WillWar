import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { addUser, asUser, createDb, onboard, raises } from "./harness";

const U = "00000000-0000-4000-8000-0000000000b1";
let db: PGlite;

// Times are in Asia/Kolkata (UTC+05:30). 21:30 IST = 16:00 UTC.
const due = (utc: string) =>
  db.query<{ kind: string; discreet: boolean }>("select kind, discreet from public.due_reminders($1::timestamptz)", [utc]);

beforeAll(async () => {
  db = await createDb();
  await addUser(db, U);
  await asUser(db, U, (tx) => onboard(tx, "reminder_one"));
  await db.query(
    "insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://push.example/1', 'p256dh-key-xx', 'auth-key')",
    [U],
  );
});

describe("due_reminders", () => {
  it("is due at the chosen local time and not otherwise", async () => {
    const day = new Date().toISOString().slice(0, 10);
    expect((await due(`${day}T16:05:00Z`)).rows).toEqual([{ kind: "checkin", discreet: true }]);
    expect((await due(`${day}T16:20:00Z`)).rows).toEqual([]);
  });

  it("respects quiet hours unless Night watch is on", async () => {
    const day = new Date().toISOString().slice(0, 10);
    await db.query("update public.profiles set reminder_time = '23:30' where id = $1", [U]);
    expect((await due(`${day}T18:05:00Z`)).rows).toEqual([]); // 23:35 IST, quiet hours
    await db.query("update public.profiles set night_watch = true where id = $1", [U]);
    expect((await due(`${day}T17:35:00Z`)).rows).toEqual([{ kind: "night_watch", discreet: true }]); // 23:05 IST
  });

  it("skips people who already checked in today", async () => {
    await db.query("update public.profiles set reminder_time = '21:30', night_watch = false where id = $1", [U]);
    await asUser(db, U, (tx) => tx.query("select public.check_in()"));
    const today = await db.query<{ d: string }>("select ((now() at time zone 'Asia/Kolkata')::date)::text d");
    expect((await due(`${today.rows[0].d}T16:05:00Z`)).rows).toEqual([]);
  });

  it("is server-only", async () => {
    expect(await raises(asUser(db, U, (tx) => tx.query("select * from public.due_reminders()")))).toMatch(/permission denied/);
  });
});
