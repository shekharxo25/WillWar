import Link from "next/link";
import type { Sponsor } from "@/lib/config/sponsors";

/**
 * Sponsored card: article-card footprint, "Sponsored" footnote top-left, dashed hairline border.
 * Never imitates an article title style and never uses LED red.
 */
export function HouseAd({ sponsor, onClick }: { sponsor: Sponsor; onClick?: () => void }) {
  return (
    <aside aria-label="Sponsored" className="rounded-card border border-dashed border-[var(--hairline)] p-5">
      <p className="text-[13px] leading-[18px] text-text-2">Sponsored</p>
      <p className="mt-2 text-[17px] leading-[22px]">{sponsor.title}</p>
      <p className="mt-1 text-[15px] leading-5 text-text-2">{sponsor.body}</p>
      <Link href={sponsor.href} onClick={onClick} className="press mt-3 inline-flex min-h-[44px] items-center text-[15px] leading-5 font-semibold underline underline-offset-4">
        {sponsor.cta}
      </Link>
    </aside>
  );
}
