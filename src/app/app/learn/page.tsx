import type { Metadata } from "next";
import { LearnFeed } from "@/components/learn/LearnFeed";
import { publishedArticles } from "@/lib/learn/articles";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnFeed articles={publishedArticles()} />;
}
