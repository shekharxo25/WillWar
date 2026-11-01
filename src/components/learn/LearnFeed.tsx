"use client";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { AdSlot } from "@/components/ads/AdSlot";
import { EvidenceChip } from "@/components/ui/EvidenceChip";
import { Segmented } from "@/components/ui/Segmented";
import type { ArticleCardData } from "@/lib/learn/articles";
import { BookOpenIllustration } from "./BookOpenIllustration";

type Filter = "all" | ArticleCardData["evidence"];
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strong", label: "Strong" },
  { value: "moderate", label: "Moderate" },
  { value: "mixed", label: "Mixed" },
  { value: "myth", label: "Myth" },
];

/** Feed with search, evidence filters, cards, and a Sponsored slot after every sixth article (free only). */
export function LearnFeed({ articles, basePath, pro = false }: { articles: ArticleCardData[]; basePath: "/learn" | "/app/learn"; pro?: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return articles.filter(
      (a) => (filter === "all" || a.evidence === filter) && (!needle || a.title.toLowerCase().includes(needle) || a.summary.toLowerCase().includes(needle)),
    );
  }, [articles, q, filter]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search articles</span>
        <MagnifyingGlass size={18} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-11 w-full rounded-button bg-raised pl-10 pr-4 text-[17px] text-text placeholder:text-text-3 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--text)]"
        />
      </label>
      <div className="mt-3">
        <Segmented value={filter} onChange={setFilter} options={FILTERS} label="Evidence grade" />
      </div>

      {articles.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center text-text-2">
          <BookOpenIllustration size={72} />
          <p className="mt-4 text-[17px] leading-[22px]">Articles are with our reviewers. Check back soon.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center text-text-2">
          <BookOpenIllustration size={72} />
          <p className="mt-4 text-[17px] leading-[22px]">Nothing matches that yet.</p>
          <button
            type="button"
            className="press mt-2 min-h-[44px] px-3 text-[17px] text-text underline underline-offset-4"
            onClick={() => {
              setQ("");
              setFilter("all");
            }}
          >
            Show all articles
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((a, i) => (
            <Fragment key={a.slug}>
              <li>
                <Link href={`${basePath}/${a.slug}`} className="press block rounded-card bg-raised p-5">
                  <div className="flex items-center gap-2">
                    <EvidenceChip grade={a.evidence} />
                    <span className="text-[13px] leading-[18px] text-text-2">{a.readMinutes} min read</span>
                    {a.draft && <span className="text-[13px] leading-[18px] text-text-2">Draft</span>}
                  </div>
                  <h2 className="mt-3 text-[17px] leading-[22px] font-semibold">{a.title}</h2>
                  <p className="mt-1 text-[15px] leading-5 text-text-2">{a.summary}</p>
                </Link>
              </li>
              {!pro && (i + 1) % 6 === 0 && (
                <li>
                  <AdSlot placement="learn_feed" pro={pro} />
                </li>
              )}
            </Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
