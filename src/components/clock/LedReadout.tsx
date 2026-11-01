import { pad2 } from "@/lib/time";

/**
 * DSEG7 Classic digits in --led with an unlit "8" ghost layer behind each digit.
 * Digits change instantly (no tweening). Steady colons. Optional labels under each pair.
 */
export function LedReadout({
  groups,
  labels,
  size = 52,
  blink = false,
  ariaLabel,
}: {
  groups: (number | string)[];
  labels?: string[];
  size?: number;
  blink?: boolean;
  ariaLabel: string;
}) {
  return (
    <div role="timer" aria-label={ariaLabel} className="no-select flex items-start justify-center">
      {groups.map((g, i) => {
        const text = typeof g === "number" ? pad2(g) : g;
        return (
          <div key={i} className="flex items-start">
            {i > 0 && (
              <span aria-hidden className="led px-[0.08em] text-[var(--led-housing)]" style={{ fontSize: size * 0.8, lineHeight: `${size}px` }}>
                :
              </span>
            )}
            <div className="flex flex-col items-center">
              <span aria-hidden className="led relative block" style={{ fontSize: size, lineHeight: 1 }}>
                <span className="text-[var(--led-ghost)]">{text.replace(/\d/g, "8")}</span>
                <span className={`absolute inset-0 text-[var(--led-housing)] ${blink ? "led-blink" : ""}`}>{text}</span>
              </span>
              {labels && <span className="mt-1.5 text-[11px] leading-[13px] text-[var(--housing-label)]">{labels[i]}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
