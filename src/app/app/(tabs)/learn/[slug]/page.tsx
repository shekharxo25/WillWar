import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Screen } from "@/components/ui/Screen";
import { ArticleView } from "@/components/learn/ArticleView";
import { AppAdSlot } from "@/components/learn/AppLearn";
import { ALL_ARTICLES, getArticle } from "@/lib/learn/articles";

export function generateStaticParams() {
  // Every slug is generated (Cache Components needs at least one); hidden drafts render notFound().
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  return a ? { title: a.title } : {};
}

export default async function AppArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  return (
    <Screen title={article.title.toUpperCase()} back="/app/learn">
      <ArticleView article={article} showTitle={false} endSlot={<AppAdSlot placement="learn_article_end" />} />
    </Screen>
  );
}
