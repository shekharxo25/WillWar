import Link from "next/link";

/** Plain page for legal and support content. No imagery. */
export function StaticPage({ title, draft = false, children }: { title: string; draft?: boolean; children: React.ReactNode }) {
  return (
    <>
      <header className="pt-safe">
        <div className="l-wrap flex h-14 items-center">
          <Link href="/" className="font-display text-[30px] leading-none">
            WillWar
          </Link>
        </div>
      </header>
      <main className="l-wrap pt-8">
        <article className="l-col">
          <h1 className="l-h2">{title}</h1>
          {draft && (
            <p className="mt-6 rounded-card bg-raised p-4 text-[15px] leading-5 text-text-2">
              Draft placeholder. This page is waiting for review by counsel before launch and is not yet a binding document.
            </p>
          )}
          <div className="l-body mt-8 space-y-5 [&_h2]:mt-10 [&_h2]:text-[22px] [&_h2]:leading-[28px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </div>
        </article>
      </main>
    </>
  );
}
