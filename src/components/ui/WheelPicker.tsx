"use client";
import { useEffect, useRef } from "react";

const ROW = 40;

/** iOS-style wheel: scroll-snap column, five visible rows, selection band in the middle. */
export function WheelColumn<T extends string | number>({
  items,
  value,
  onChange,
  label,
  format = (v) => String(v),
  width = "flex-1",
}: {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  format?: (v: T) => string;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, items.indexOf(value));
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - idx * ROW) > 2) el.scrollTop = idx * ROW;
  }, [idx]);

  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)));
      if (items[i] !== value) onChange(items[i]);
    }, 80);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" && idx < items.length - 1) { e.preventDefault(); onChange(items[idx + 1]); }
        if (e.key === "ArrowUp" && idx > 0) { e.preventDefault(); onChange(items[idx - 1]); }
      }}
      className={`no-select relative h-[200px] snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${width}`}
      style={{ maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)" }}
    >
      <div style={{ height: ROW * 2 }} />
      {items.map((it, i) => (
        <div
          key={String(it)}
          role="option"
          aria-selected={i === idx}
          onClick={() => onChange(it)}
          className={`flex snap-center items-center justify-center text-[20px] ${i === idx ? "text-text" : "text-text-3"}`}
          style={{ height: ROW }}
        >
          {format(it)}
        </div>
      ))}
      <div style={{ height: ROW * 2 }} />
    </div>
  );
}

export function Wheel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex gap-1 rounded-card bg-raised px-2">
      <div aria-hidden className="pointer-events-none absolute inset-x-2 top-[80px] h-10 rounded-[8px] bg-[var(--hairline)]" />
      {children}
    </div>
  );
}
