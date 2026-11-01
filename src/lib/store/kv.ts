"use client";

import { openDB, type IDBPDatabase } from "idb";

// One IndexedDB database for everything kept on the device: device-mode state,
// the cloud offline queue and the last cloud snapshot (for offline launches).
const DB_NAME = "willwar";
const STORE = "kv";

let db: Promise<IDBPDatabase> | null = null;

function open() {
  db ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    },
  });
  return db;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await (await open()).get(STORE, key)) as T | undefined;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  await (await open()).put(STORE, value, key);
}

export async function kvDelete(key: string): Promise<void> {
  await (await open()).delete(STORE, key);
}
