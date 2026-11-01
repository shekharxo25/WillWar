import { ArrowSquareOut, Prohibit } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { type Article, GRADE_LABEL, type Grade } from "@/lib/learn/articles";

/** Evidence chip per DESIGN.md: Strong filled, Moderate wash, Mixed neutral, Myth outlined with a strike icon. */
export function EvidenceChip({ grade }: { grade: Grade }) {
  const cls: Record<Grade, string> = {
    strong: "bg-tide text-on-tide",
    moderate: "bg-tide-wash text-tide",
    mixed: "bg-tertiary text-label-2",
    myth: "bg-surface text-label-2 ring-[0.5px] ring-separator",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-footnote font-semibold ${cls[grade]}`}>
      {grade === "myth" && <Prohibit size={12} aria-hidden />}
      Evidence: {GRADE_LABEL[grade]}
    </span>
  );
}

export function ArticleCard({ article, href }: { article: Article; href: string }) {
  return (
    <Link href={href} className="pressable block rounded-card bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <EvidenceChip grade={article.evidence} />
        {article.draft && <span className="text-footnote text-label-2">Draft, not yet reviewed</span>}
      </div>
      <h3 className="mt-3 text-headline">{article.title}</h3>
      <p className="mt-1 text-subhead text-label-2">{article.summary}</p>
      <p className="mt-3 text-footnote text-label-2">
        {article.readMinutes} min read, {article.topic.toLowerCase()}
      </p>
    </Link>
  );
}

/** L2 body: evidence box first, text at 17/26 with a 68-character measure, sources last. */
export function ArticleBody({ article }: { article: Article }) {
  return (
    <article className="max-w-[68ch]">
      {article.draft && (
        <p className="mb-4 rounded-cell bg-tertiary px-3 py-2 text-footnote">Draft, not yet reviewed. Not published in production.</p>
      )}
      <h1 className="text-large-title font-bold text-balance">{article.title}</h1>
      <section className="mt-5 rounded-card bg-surface p-5" aria-label="Evidence">
        <EvidenceChip grade={article.evidence} />
        <h2 className="mt-4 text-headline">What the research supports</h2>
        <p className="mt-1 text-body">{article.supports}</p>
        <h2 className="mt-4 text-headline">What it doesn&apos;t</h2>
        <p className="mt-1 text-body">{article.doesNotSupport}</p>
      </section>
      <div className="mt-6 space-y-4 text-[1.0625rem] leading-[1.625rem]">
        {article.body.map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i} className="pt-2 text-title-2 font-bold">
              {p.slice(3)}
            </h2>
          ) : (
            <p key={i}>{p}</p>
          ),
        )}
      </div>
      <section className="mt-8" aria-label="Sources">
        <h2 className="text-headline">Sources</h2>
        <ul className="mt-2 grid gap-2">
          {article.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-subhead text-tide">
                <ArrowSquareOut size={16} className="mt-0.5 shrink-0" aria-hidden />
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-8 text-footnote text-label-2">
        Not medical advice. If urges or habits are affecting your life, talk to a doctor or counselor.{" "}
        <Link href="/support" className="text-tide">
          Get support
        </Link>
        .
        {article.reviewedBy && ` Reviewed by ${article.reviewedBy} on ${article.reviewedOn}.`}
      </p>
    </article>
  );
}
