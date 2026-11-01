import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/learn/ArticleView";
import { PublicChrome } from "@/components/learn/PublicChrome";
import { ALL_ARTICLES, getArticle } from "@/lib/learn/articles";

export function generateStaticParams() {
  // Every slug is generated (Cache Components needs at least one); hidden drafts render notFound().
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return { title: a.title, description: a.summary, robots: a.draft ? { index: false } : undefined };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return (
    <PublicChrome>
      <Link href="/learn" className="press inline-flex min-h-[44px] items-center text-[15px] leading-5 text-text-2">
        All articles
      </Link>
      <ArticleView article={article} />
    </PublicChrome>
  );
}
