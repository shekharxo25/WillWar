"use client";
export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`press min-h-[44px] rounded-chip px-4 text-[15px] leading-5 disabled:opacity-40 ${
        selected ? "bg-primary font-semibold text-on-primary" : "bg-raised text-text shadow-[inset_0_0_0_0.5px_var(--hairline)]"
      }`}
    >
      {children}
    </button>
  );
}
