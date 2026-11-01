"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "plain" | "destructive" | "destructive-plain";

const base =
  "pressable inline-flex items-center justify-center gap-2 font-semibold text-headline select-none disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "h-[50px] rounded-btn bg-tide px-5 text-on-tide disabled:bg-tertiary disabled:text-label-3",
  secondary: "h-[50px] rounded-btn bg-tide-wash px-5 text-tide disabled:text-label-3",
  plain: "min-h-11 px-3 text-tide disabled:text-label-3",
  destructive: "h-[50px] rounded-btn bg-destructive px-5 text-white disabled:bg-tertiary disabled:text-label-3",
  "destructive-plain": "min-h-11 px-3 text-destructive disabled:text-label-3",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  icon?: ReactNode;
  busy?: boolean;
}

export function Button({ variant = "primary", full, icon, busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className ?? ""}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  full,
  icon,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  full?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className ?? ""}`}>
      {icon}
      {children}
    </Link>
  );
}
