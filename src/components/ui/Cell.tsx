import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

/** Inset grouped list. 13pt sentence-case header in --text-2. */
export function CellGroup({ header, footer, children }: { header?: string; footer?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      {header && <h2 className="mb-2 px-4 text-[13px] leading-[18px] text-text-2">{header}</h2>}
      <div className="overflow-hidden rounded-card bg-raised [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:left-4 [&>*+*]:before:top-0 [&>*+*]:before:h-[0.5px] [&>*+*]:before:bg-[var(--hairline)] [&>*]:relative">
        {children}
      </div>
      {footer && <p className="mt-2 px-4 text-[13px] leading-[18px] text-text-2">{footer}</p>}
    </section>
  );
}

type CellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  accessory?: React.ReactNode;
  chevron?: boolean;
  tone?: "default" | "destructive";
};

export function Cell({ title, subtitle, value, icon, href, onClick, accessory, chevron, tone = "default" }: CellProps) {
  const inner = (
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-2.5 text-left">
      {icon && <span className="shrink-0 text-text-2">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block text-[17px] leading-[22px] ${tone === "destructive" ? "text-destructive" : ""}`}>{title}</span>
        {subtitle && <span className="block text-[15px] leading-5 text-text-2">{subtitle}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-[17px] leading-[22px] text-text-2">{value}</span>}
      {accessory}
      {(chevron ?? !!(href || onClick)) && <CaretRight weight="bold" size={16} className="shrink-0 text-text-3" aria-hidden />}
    </div>
  );
  if (href) return <Link href={href} className="press block">{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="press block w-full">{inner}</button>;
  return <div>{inner}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-[180ms] ${checked ? "bg-lamp-go" : "bg-[var(--hairline)]"}`}
    >
      <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-[var(--knob)] transition-transform duration-[180ms] ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
    </button>
  );
}
