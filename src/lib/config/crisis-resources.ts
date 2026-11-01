/** Crisis numbers come from here, never from the model (Part 8.4). Reviewed quarterly. */
export type CrisisResource = { region: string; label: string; detail: string; href: string; country: "IN" | "US" | "GB" | "ANY" };

export const CRISIS_RESOURCES: CrisisResource[] = [
  { region: "India", country: "IN", label: "Tele-MANAS, free and 24/7", detail: "14416", href: "tel:14416" },
  { region: "India", country: "IN", label: "Tele-MANAS toll-free", detail: "1-800-891-4416", href: "tel:18008914416" },
  { region: "United States", country: "US", label: "988 Suicide & Crisis Lifeline: call or text", detail: "988", href: "tel:988" },
  { region: "United Kingdom", country: "GB", label: "Samaritans", detail: "116 123", href: "tel:116123" },
  { region: "Elsewhere", country: "ANY", label: "Find a helpline", detail: "findahelpline.com", href: "https://findahelpline.com" },
  { region: "Immediate danger", country: "ANY", label: "Call your local emergency number", detail: "", href: "" },
];

export const CRISIS_CARD_COPY =
  "It sounds like you're carrying a lot right now. You deserve support from a real person. You can reach someone now:";

export function resourcesFor(country?: string | null): CrisisResource[] {
  if (!country) return CRISIS_RESOURCES;
  const local = CRISIS_RESOURCES.filter((r) => r.country === country);
  return local.length ? [...local, ...CRISIS_RESOURCES.filter((r) => r.country === "ANY")] : CRISIS_RESOURCES;
}
