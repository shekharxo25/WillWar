"use client";

import { Switch as RadixSwitch, ToggleGroup } from "radix-ui";
import type { ReactNode } from "react";

/** Segmented control: tertiary track, white thumb, 32pt, 13pt 600 labels. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className="grid h-8 rounded-[9px] bg-tertiary p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="rounded-[7px] text-footnote font-semibold text-label transition-[background,box-shadow] duration-150 data-[state=on]:bg-[var(--segment-thumb)] data-[state=on]:shadow-[0_1px_4px_rgb(0_0_0/0.12)]"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/** Selection chip: height 36, radius 18, 15pt label, 16pt icon. */
export function Chip({
  selected,
  onClick,
  icon,
  children,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`pressable inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-subhead disabled:opacity-40 ${
        selected ? "bg-tide-wash text-tide" : "border-[0.5px] border-separator bg-surface text-label"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      disabled={disabled}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-tertiary transition-colors duration-200 data-[state=checked]:bg-tide disabled:opacity-50"
    >
      <RadixSwitch.Thumb className="block size-[27px] translate-x-0.5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
    </RadixSwitch.Root>
  );
}

/** Intensity scale 1–10: two rows of five 52pt circles; labels at the ends only. */
export function IntensityScale({
  value,
  onChange,
  label,
  inverted,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
  inverted?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="grid grid-cols-5 justify-items-center gap-3">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n}`}
              onClick={() => onChange(n)}
              className={`pressable num flex size-[52px] items-center justify-center rounded-full text-headline ${
                on
                  ? "bg-tide text-on-tide"
                  : inverted
                    ? "bg-white/10 text-white"
                    : "border-[0.5px] border-separator bg-surface text-label"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className={`mt-2 flex justify-between px-1 text-footnote ${inverted ? "text-white/70" : "text-label-2"}`}>
        <span>Barely there</span>
        <span>Overwhelming</span>
      </div>
    </div>
  );
}
