import { AdSlot } from "@/components/ads/AdSlot";
import { EvidenceChip } from "@/components/ui/EvidenceChip";
import type { Article } from "@/lib/learn/articles";

const GRADE: Record<Article["evidence"], string> = { strong: "Strong", moderate: "Moderate", mixed: "Mixed", myth: "Myth" };

/** Article body: evidence box at top, 17/26 body at 68 characters, sources, disclaimer, end slot. */
export function ArticleView({ article, showTitle = true, endSlot }: { article: Article; showTitle?: boolean; endSlot?: React.ReactNode }) {
  const { Body } = article;
  return (
    <article className="max-w-[68ch]">
      {showTitle && <h1 className="display text-[40px] leading-[40px]">{article.title}</h1>}
      <div className="mt-3 flex items-center gap-2">
        <EvidenceChip grade={article.evidence} />
        <span className="text-[13px] leading-[18px] text-text-2">{article.readMinutes} min read</span>
      </div>
      {article.draft && (
        <p className="mt-4 rounded-card border border-dashed border-[var(--text-3)] px-4 py-3 text-[15px] leading-5 text-text-2">
          Draft: not yet reviewed. Shown for preview only.
        </p>
      )}
      <section aria-label="Evidence" className="mt-5 rounded-card bg-raised p-5">
        <h2 className="text-[17px] leading-[22px] font-semibold">Evidence: {GRADE[article.evidence]}</h2>
        <h3 className="mt-3 text-[13px] leading-[18px] text-text-2">What the research supports</h3>
        <p className="mt-1 text-[15px] leading-5">{article.supports}</p>
        <h3 className="mt-3 text-[13px] leading-[18px] text-text-2">What it doesn&apos;t</h3>
        <p className="mt-1 text-[15px] leading-5">{article.doesnt}</p>
      </section>
      <div className="mt-2">
        <Body />
      </div>
      <section aria-labelledby="sources" className="mt-10">
        <h2 id="sources" className="text-[13px] leading-[18px] text-text-2">
          Sources
        </h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-[15px] leading-5 text-text-2">
          {article.sources.map((s) => (
            <li key={s.label}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {s.label}
                </a>
              ) : (
                s.label
              )}
            </li>
          ))}
        </ol>
      </section>
      <p className="mt-8 text-[13px] leading-[18px] text-text-2">
        Not medical advice. If this is affecting your life, talk to a doctor or counselor.
      </p>
      <div className="mt-6">
        {endSlot ?? <AdSlot placement="learn_article_end" />}
      </div>
    </article>
  );
}
