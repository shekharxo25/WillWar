import type { Metadata } from "next";
import { LearnFeed } from "@/components/learn/LearnFeed";
import { PublicChrome } from "@/components/learn/PublicChrome";
import { articleCards } from "@/lib/learn/articles";

export const metadata: Metadata = {
  title: "Learn",
  description: "Straight answers, graded. Every article shows how strong the evidence is.",
};

export default function LearnPage() {
  return (
    <PublicChrome>
      <h1 className="display text-[40px] leading-[40px]">STRAIGHT ANSWERS. GRADED.</h1>
      <p className="mt-3 max-w-[68ch] text-[17px] leading-[26px] text-text-2">
        Every article shows how strong the evidence is. When the internet says one thing and the research says another, we show you both.
      </p>
      <div className="mt-6">
        <LearnFeed articles={articleCards()} basePath="/learn" />
      </div>
    </PublicChrome>
  );
}
