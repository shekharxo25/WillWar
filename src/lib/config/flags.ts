export type WarChestMode = "off" | "promise" | "stake";

export function warChestMode(): WarChestMode {
  const v = process.env.NEXT_PUBLIC_WAR_CHEST_MODE;
  return v === "off" || v === "stake" ? v : "promise";
}

export type AdsMode = "house" | "adsense" | "h5";
export function adsMode(): AdsMode {
  const v = process.env.NEXT_PUBLIC_ADS_MODE;
  return v === "adsense" || v === "h5" ? v : "house";
}

export const cloudEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const isProduction = () => process.env.NODE_ENV === "production";
