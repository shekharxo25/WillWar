import "server-only";

/** JSON helpers for route handlers. Error bodies carry a code only, never personal data. */
export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function fail(error: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ error, ...extra }, { status });
}

/** Maps a Postgres/PostgREST error to a short code (our RPCs raise snake_case codes). */
export function dbCode(e: { message?: string; code?: string } | null | undefined): string {
  const m = e?.message ?? "";
  const hit = m.match(/^[a-z_0-9]{3,40}$/) ?? m.match(/\b([a-z]+(?:_[a-z0-9]+)+)\b/);
  return hit ? hit[0] : "server_error";
}

export async function readJson<T = unknown>(req: Request, maxBytes = 8_192): Promise<T | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
