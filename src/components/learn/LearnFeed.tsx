"use client";

import { BookOpenText, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { LargeTitle } from "@/components/app/AppChrome";
import { Chip } from "@/components/ui/Controls";
import { houseAdFor, LEARN_FEED_EVERY } from "@/lib/config/ads";
import { type Article, GRADE_LABEL, GRADES, type Grade } from "@/lib/learn/articles";
import { useWillWar } from "@/lib/store/provider";
import { ArticleCard } from "./Learn";

/** L1: search, grade filters, article cards. (The sponsored slot follows every sixth article.) */
export function LearnFeed({ articles }: { articles: Article[] }) {
  const { isPro } = useWillWar();
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState<Grade | "all">("all");
  const needle = q.trim().toLowerCase();
  const shown = articles.filter(
    (a) => (grade === "all" || a.evidence === grade) && (!needle || `${a.title} ${a.summary} ${a.topic}`.toLowerCase().includes(needle)),
  );

  return (
    <main>
      <LargeTitle title="Learn" />
      <div className="space-y-4 px-4">
        <label className="flex h-11 items-center gap-2 rounded-cell bg-tertiary px-3">
          <MagnifyingGlass size={18} className="text-label-2" aria-hidden />
          <span className="sr-only">Search articles</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles"
            className="h-full flex-1 bg-transparent text-body outline-none placeholder:text-label-2"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by evidence">
          <Chip selected={grade === "all"} onClick={() => setGrade("all")}>
            All
          </Chip>
          {GRADES.map((g) => (
            <Chip key={g} selected={grade === g} onClick={() => setGrade(g)}>
              {GRADE_LABEL[g]}
            </Chip>
          ))}
        </div>
        {articles.length === 0 ? (
          <div className="rounded-sheet bg-surface p-8 text-center">
            <BookOpenText size={32} className="mx-auto text-tide" aria-hidden />
            <p className="mt-3 text-body">Articles are being reviewed. Each one gets an evidence grade and sources before it&apos;s published.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-body text-label-2">Nothing matches that. Try another word or filter.</p>
        ) : (
          <div className="grid gap-3">
            {shown.map((a, i) => (
              <Fragment key={a.slug}>
                <ArticleCard article={a} href={`/app/learn/${a.slug}`} />
                {!isPro && (i + 1) % LEARN_FEED_EVERY === 0 && <SponsoredCard slot={(i + 1) / LEARN_FEED_EVERY - 1} />}
              </Fragment>
            ))}
          </div>
        )}
        <p className="pb-4 text-center text-footnote text-label-2">Not medical advice. Every article shows its grade and sources.</p>
      </div>
    </main>
  );
}

/** Sponsored card (DESIGN.md): article footprint, "Sponsored" label, neutral hairline, never Tide colour. */
function SponsoredCard({ slot }: { slot: number }) {
  const ad = houseAdFor(slot);
  return (
    <aside aria-label="Sponsored" className="rounded-card border-[0.5px] border-separator bg-surface p-5">
      <p className="text-footnote text-label-2">Sponsored</p>
      <p className="mt-2 text-headline">{ad.title}</p>
      <p className="mt-1 text-subhead text-label-2">{ad.body}</p>
      <Link href={ad.href} className="pressable mt-3 inline-flex min-h-11 items-center text-subhead font-semibold text-label">
        {ad.cta}
      </Link>
    </aside>
  );
}
