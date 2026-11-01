"use client";
/**
 * Offline queue in IndexedDB. iOS has no Background Sync, so the queue drains on
 * load, focus, online and visibilitychange (see AppProvider).
 */
import { openDB, type IDBPDatabase } from "idb";

export type QueuedOp = { kind: "check_in" } | { kind: "urge_session"; row: Record<string, unknown> };
type Row = { id?: number; op: QueuedOp; at: string };

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  dbp ??= openDB("willwar", 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("queue")) d.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      if (!d.objectStoreNames.contains("journal")) d.createObjectStore("journal", { keyPath: "id" });
    },
  });
  return dbp;
}

export async function enqueue(op: QueuedOp) {
  const d = await db();
  // Check-ins are idempotent per day; keep one queued.
  if (op.kind === "check_in") {
    const all = (await d.getAll("queue")) as Row[];
    if (all.some((r) => r.op.kind === "check_in")) return;
  }
  await d.add("queue", { op, at: new Date().toISOString() } satisfies Row);
}

export async function pending(): Promise<number> {
  try {
    return (await db()).count("queue");
  } catch {
    return 0;
  }
}

let draining = false;
/** Runs each queued op once; failures stay queued for the next trigger. Returns ops sent. */
export async function drain(run: (op: QueuedOp) => Promise<void>): Promise<number> {
  if (draining || (typeof navigator !== "undefined" && !navigator.onLine)) return 0;
  draining = true;
  let sent = 0;
  try {
    const d = await db();
    const rows = (await d.getAll("queue")) as Row[];
    for (const r of rows) {
      try {
        await run(r.op);
        await d.delete("queue", r.id!);
        sent++;
      } catch {
        break;
      }
    }
  } finally {
    draining = false;
  }
  return sent;
}
