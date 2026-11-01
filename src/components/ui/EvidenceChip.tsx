import { X } from "@phosphor-icons/react/dist/ssr";
export type Evidence = "strong" | "moderate" | "mixed" | "myth";
const label: Record<Evidence, string> = { strong: "Strong", moderate: "Moderate", mixed: "Mixed", myth: "Myth" };

export function EvidenceChip({ grade }: { grade: Evidence }) {
  const cls = {
    strong: "bg-primary text-on-primary",
    moderate: "shadow-[inset_0_0_0_1px_var(--text)] text-text",
    mixed: "bg-raised text-text-2",
    myth: "border border-dashed border-[var(--text-2)] text-text-2",
  }[grade];
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-chip px-2 text-[13px] leading-[18px] font-semibold ${cls}`}>
      {grade === "myth" && <X weight="bold" size={12} aria-hidden />}
      {label[grade]}
    </span>
  );
}
