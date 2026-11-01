"use client";
import * as ToggleGroup from "@radix-ui/react-toggle-group";

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      className="flex h-[34px] w-full rounded-chip bg-bg p-[2px]"
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="press flex-1 rounded-[7px] text-[13px] leading-[18px] font-semibold text-text-2 data-[state=on]:bg-primary data-[state=on]:text-on-primary"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
