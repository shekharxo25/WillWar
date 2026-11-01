"use client";

import { CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Inset grouped list (DESIGN.md: radius 12, inset 16, 0.5px separators inset to text). */
export function InsetGroup({
  header,
  footer,
  children,
  className,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {header && <h2 className="px-4 pb-1.5 text-footnote text-label-2">{header}</h2>}
      <div className="overflow-hidden rounded-cell bg-surface">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-footnote text-label-2">{footer}</p>}
    </section>
  );
}

export interface CellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  chevron?: boolean;
  trailing?: ReactNode;
  tone?: "default" | "tide" | "destructive";
  disabled?: boolean;
}

export function Cell({
  title,
  subtitle,
  value,
  icon,
  href,
  external,
  onClick,
  chevron,
  trailing,
  tone = "default",
  disabled,
}: CellProps) {
  const titleColor = tone === "tide" ? "text-tide" : tone === "destructive" ? "text-destructive" : "text-label";
  const showChevron = chevron ?? Boolean(href || onClick);
  const inner = (
    <div className={`flex items-center gap-3 pl-4 ${subtitle ? "min-h-[52px]" : "min-h-11"}`}>
      {icon && <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tide-wash text-tide">{icon}</span>}
      <div className="hairline-b flex min-h-[inherit] flex-1 items-center gap-2 py-2.5 pr-4 group-last/cell:border-b-0">
        <div className="min-w-0 flex-1">
          <div className={`text-body ${titleColor}`}>{title}</div>
          {subtitle && <div className="text-subhead text-label-2">{subtitle}</div>}
        </div>
        {value !== undefined && <div className="shrink-0 text-body text-label-2">{value}</div>}
        {trailing}
        {showChevron && <CaretRight size={16} weight="bold" className="shrink-0 text-label-3" aria-hidden />}
      </div>
    </div>
  );
  const cls = `group/cell block w-full text-left ${href || onClick ? "pressable active:bg-tertiary" : ""} ${disabled ? "opacity-50" : ""}`;
  if (href && external) {
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} disabled={disabled}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function Card({ children, className, feature }: { children: ReactNode; className?: string; feature?: boolean }) {
  return (
    <div className={`${feature ? "rounded-sheet p-6" : "rounded-card p-5"} bg-surface ${className ?? ""}`}>{children}</div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-tertiary motion-reduce:animate-none ${className ?? ""}`} />;
}
