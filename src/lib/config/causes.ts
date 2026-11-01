/**
 * Placeholder causes. Marked inactive in seed.sql until the founder vets real charities
 * (docs/HANDOFF.md). Device mode shows them with a "placeholder" note.
 */
export type Cause = { id: string; name: string; country: "IN" | "US" | "GB" | "GLOBAL"; url: string; placeholder: boolean };

export const CAUSES: Cause[] = [
  { id: "placeholder-in", name: "Placeholder cause (India)", country: "IN", url: "https://example.org/cause-in", placeholder: true },
  { id: "placeholder-global", name: "Placeholder cause (global)", country: "GLOBAL", url: "https://example.org/cause-global", placeholder: true },
];

export const CHEST_AMOUNTS = {
  INR: { presets: [9900, 19900, 49900, 99900], min: 4900, max: 500000, symbol: "₹" },
  USD: { presets: [200, 500, 1000, 2000], min: 200, max: 10000, symbol: "$" },
} as const;

export function formatMoney(minor: number, currency: "INR" | "USD"): string {
  const major = minor / 100;
  if (currency === "INR") return `₹${major.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return `$${major.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(major) ? 0 : 2 })}`;
}
