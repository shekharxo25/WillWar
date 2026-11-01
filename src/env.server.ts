import "server-only";
import { z } from "zod";

// Server secrets. Read lazily so a route that doesn't need a secret still works
// when that secret isn't configured; each route fails closed with a clear error.
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-5-5"),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
  RAZORPAY_ANNUAL_PLAN_ID: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().min(1).default("mailto:hello@example.com"),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  PRICE_SEASON_INR: z.coerce.number().int().positive().default(149),
  PRICE_ANNUAL_INR: z.coerce.number().int().positive().default(799),
  CRON_SECRET: z.string().min(16).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (!cached) {
    const raw = Object.fromEntries(
      Object.keys(serverSchema.shape).map((k) => [k, process.env[k] === "" ? undefined : process.env[k]]),
    );
    cached = serverSchema.parse(raw);
  }
  return cached;
}

export class MissingConfigError extends Error {
  constructor(public readonly key: keyof ServerEnv) {
    super(`missing_config:${key}`);
  }
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = serverEnv()[key];
  if (value === undefined || value === null) throw new MissingConfigError(key);
  return value as NonNullable<ServerEnv[K]>;
}
