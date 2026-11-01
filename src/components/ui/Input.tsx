import type { ComponentProps } from "react";
export function Input({ error, className = "", ...rest }: ComponentProps<"input"> & { error?: string | null }) {
  return (
    <div>
      <input
        className={`h-[52px] w-full rounded-button bg-raised px-4 text-[17px] text-text placeholder:text-text-3 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--text)] ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <p className="mt-1.5 text-[13px] leading-[18px] text-destructive">{error}</p>}
    </div>
  );
}
