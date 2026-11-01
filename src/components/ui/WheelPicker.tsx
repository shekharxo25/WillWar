"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

const ITEM = 44;
const VISIBLE = 5;

export interface WheelColumn<T extends string | number> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  align?: "left" | "center" | "right";
}

function Column<T extends string | number>({ label, options, value, onChange, align = "center" }: WheelColumn<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - index * ITEM) > 2) el.scrollTo({ top: index * ITEM });
  }, [index]);

  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (options[i] && options[i].value !== value) onChange(options[i].value);
    }, 90);
  };

  const onKey = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = options[Math.min(options.length - 1, Math.max(0, index + delta))];
    if (next) onChange(next.value);
  };

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={`${label}-${index}`}
        onScroll={onScroll}
        onKeyDown={onKey}
        className="no-callout snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: ITEM * VISIBLE, paddingBlock: ITEM * Math.floor(VISIBLE / 2) }}
      >
        {options.map((o, i) => (
          <div
            id={`${label}-${i}`}
            key={String(o.value)}
            role="option"
            aria-selected={i === index}
            onClick={() => onChange(o.value)}
            className={`num flex snap-center items-center px-3 text-[1.25rem] transition-opacity ${
              align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"
            } ${i === index ? "font-semibold text-label" : "text-label-3"}`}
            style={{ height: ITEM }}
          >
            {o.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** iOS-style wheel picker for one-time entries (date of birth, start time). */
export function WheelPicker({ columns }: { columns: WheelColumn<string | number>[] }) {
  return (
    <div className="relative flex rounded-card bg-surface px-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 rounded-cell bg-tide-wash"
        style={{ top: ITEM * Math.floor(VISIBLE / 2), height: ITEM }}
      />
      {columns.map((c) => (
        <Column key={c.label} {...c} />
      ))}
    </div>
  );
}
