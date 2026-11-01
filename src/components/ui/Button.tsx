"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "plain" | "destructive" | "led";
const base = "press no-select inline-flex items-center justify-center gap-2 rounded-button font-sans disabled:opacity-40 disabled:cursor-not-allowed";
const variants: Record<Variant, string> = {
  primary: "h-[52px] px-5 bg-primary text-on-primary text-[17px] leading-[22px] font-semibold w-full",
  secondary: "btn-secondary h-[52px] px-5 bg-raised shadow-[inset_0_0_0_1px_var(--hairline)] text-text text-[17px] leading-[22px] font-semibold w-full",
  plain: "min-h-[44px] px-3 text-text text-[17px] leading-[22px]",
  destructive: "btn-secondary h-[52px] px-5 bg-raised shadow-[inset_0_0_0_1px_var(--hairline)] text-destructive text-[17px] leading-[22px] font-semibold w-full",
  led: "h-14 px-5 bg-led text-ink w-full",
};

export function Button({ variant = "primary", className = "", ...rest }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

export function ButtonLink({ variant = "primary", className = "", ...rest }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
