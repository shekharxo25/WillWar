import Link from "next/link";

/** Minimal public header and footer for /learn and /day pages (no app chrome, no tracking). */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 glass shadow-[0_0.5px_0_var(--hairline)]">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-4 min-[414px]:px-5">
          <Link href="/" className="font-display text-[28px] leading-none">
            WillWar
          </Link>
          <Link href="/app/start" className="press flex min-h-[44px] items-center text-[15px] leading-5 font-semibold underline underline-offset-4">
            Start my 30 days
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-4 pb-24 pt-6 min-[414px]:px-5">{children}</main>
      <footer className="mx-auto max-w-[720px] px-4 pb-10 text-[13px] leading-[18px] text-text-2 min-[414px]:px-5">
        18+ only. Not medical advice. <Link href="/support" className="underline underline-offset-4">Get support</Link>
      </footer>
    </div>
  );
}
