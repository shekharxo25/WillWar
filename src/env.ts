import { z } from "zod";

// Public values are inlined at build time, so they must be read with literal
// `process.env.NEXT_PUBLIC_*` member access (no destructuring, no dynamic keys).
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_ADSENSE_CLIENT: z.string().min(1).optional(),
  NEXT_PUBLIC_SEASON_MODE: z.enum(["nnn", "rolling"]).default("nnn"),
  NEXT_PUBLIC_ADS_MODE: z.enum(["house", "adsense", "h5"]).default("house"),
  NEXT_PUBLIC_WAR_CHEST_MODE: z.enum(["off", "promise", "stake"]).default("promise"),
  NEXT_PUBLIC_PRICE_SEASON_INR: z.coerce.number().int().positive().default(149),
  NEXT_PUBLIC_PRICE_ANNUAL_INR: z.coerce.number().int().positive().default(799),
  NEXT_PUBLIC_CF_ANALYTICS_TOKEN: z.string().min(1).optional(),
});

const emptyToUndefined = (v: string | undefined) => (v === "" ? undefined : v);

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: emptyToUndefined(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: emptyToUndefined(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  NEXT_PUBLIC_ADSENSE_CLIENT: emptyToUndefined(process.env.NEXT_PUBLIC_ADSENSE_CLIENT),
  NEXT_PUBLIC_SEASON_MODE: emptyToUndefined(process.env.NEXT_PUBLIC_SEASON_MODE),
  NEXT_PUBLIC_ADS_MODE: emptyToUndefined(process.env.NEXT_PUBLIC_ADS_MODE),
  NEXT_PUBLIC_WAR_CHEST_MODE: emptyToUndefined(process.env.NEXT_PUBLIC_WAR_CHEST_MODE),
  NEXT_PUBLIC_PRICE_SEASON_INR: emptyToUndefined(process.env.NEXT_PUBLIC_PRICE_SEASON_INR),
  NEXT_PUBLIC_PRICE_ANNUAL_INR: emptyToUndefined(process.env.NEXT_PUBLIC_PRICE_ANNUAL_INR),
  NEXT_PUBLIC_CF_ANALYTICS_TOKEN: emptyToUndefined(process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN),
});

/** Cloud mode needs both Supabase public values; otherwise the app runs device-only. */
export const cloudEnabled = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

export type PublicEnv = z.infer<typeof publicSchema>;
