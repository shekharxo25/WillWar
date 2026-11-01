import "server-only";
import { NextResponse } from "next/server";
import { MissingConfigError } from "@/env.server";

/** Consistent error shape: { error: { code, message } }. Never echoes request bodies. */
export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "cache-control": "no-store", ...init?.headers } });
}

/** Maps thrown errors to responses without leaking internals or personal data into logs. */
export function handleError(route: string, e: unknown) {
  if (e instanceof MissingConfigError) return fail(503, "not_configured", "This feature isn't switched on yet.");
  console.error(JSON.stringify({ route, error: e instanceof Error ? e.name : "unknown" }));
  return fail(500, "server_error", "Something went wrong. Try again.");
}
