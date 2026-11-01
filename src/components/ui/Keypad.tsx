"use client";
/** Intensity scale 1-10: two rows of five 52pt squares, like timer keypad buttons. */
export function Keypad({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Intensity from 1 to 10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`press display flex aspect-square min-h-[52px] items-center justify-center rounded-key text-[28px] ${
              value === n ? "bg-led text-ink" : "bg-raised text-text"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[13px] leading-[18px] text-text-2">
        <span>Barely there</span>
        <span>Overwhelming</span>
      </div>
    </div>
  );
}
