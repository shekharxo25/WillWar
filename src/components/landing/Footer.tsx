import Link from "next/link";

const COLS: { h: string; links: { label: string; href: string }[] }[] = [
  { h: "Product", links: [{ label: "Today", href: "/app/today" }, { label: "Camps", href: "/#camps" }, { label: "Learn", href: "/learn" }, { label: "Pricing", href: "/#pricing" }] },
  { h: "Help", links: [{ label: "Install on iPhone", href: "/#faq" }, { label: "Get support", href: "/support" }, { label: "Contact", href: "mailto:hello@example.com" }] },
  { h: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Health disclaimer", href: "/health" }] },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t-[0.5px] border-[var(--hairline)] pb-[calc(env(safe-area-inset-bottom)+96px)] pt-12 md:pb-16">
      <div className="l-wrap grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-[34px] leading-none">WillWar</p>
          <p className="mt-3 text-[15px] leading-5 text-text-2">A 30-day streak tracker for adults.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <h2 className="text-[13px] leading-[18px] text-text-2">{c.h}</h2>
            <ul className="mt-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="press flex min-h-[44px] items-center text-[15px] leading-5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="l-wrap mt-10 text-[13px] leading-[18px] text-text-2">18+ only. Not medical advice.</p>
    </footer>
  );
}
