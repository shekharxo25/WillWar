import { ArrowLeft } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleBody } from "@/components/learn/Learn";
import { ALL_ARTICLES, getArticle } from "@/lib/learn/articles";

// Every slug is prerendered; unpublished drafts render the 404 page in production.
export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  return a ? { title: a.title, description: a.summary, openGraph: { title: a.title, description: a.summary, type: "article" } } : { title: "Learn" };
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return <ArticleBody article={article} />;
}

export default function PublicArticlePage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <Link href="/#evidence" className="pressable inline-flex min-h-11 items-center gap-1 text-body text-tide">
        <ArrowLeft size={18} aria-hidden /> WillWar
      </Link>
      <div className="mt-4">
        <Suspense>
          <Article params={params} />
        </Suspense>
      </div>
      <Link href="/app/start" className="pressable mt-10 inline-flex h-[50px] items-center rounded-btn bg-tide px-6 text-headline font-semibold text-on-tide">
        Start my 30 days
      </Link>
    </main>
  );
}
