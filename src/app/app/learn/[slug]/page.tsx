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

export async function generateMetadata({ params }: PageProps<"/app/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getArticle(slug)?.title ?? "Learn" };
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return <ArticleBody article={article} />;
}

export default function AppArticlePage({ params }: PageProps<"/app/learn/[slug]">) {
  return (
    <main className="px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
      <Link href="/app/learn" className="pressable -ml-1 inline-flex min-h-11 items-center gap-1 text-body text-tide">
        <ArrowLeft size={18} aria-hidden /> Learn
      </Link>
      <div className="mt-2">
        <Suspense>
          <Article params={params} />
        </Suspense>
      </div>
    </main>
  );
}
