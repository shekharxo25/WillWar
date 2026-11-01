import type { ComponentType } from "react";
import { ArticleMeta, isDraft, showDrafts } from "./schema";

import * as a01 from "../../../content/learn/day-7-testosterone-claim.mdx";
import * as a02 from "../../../content/learn/ejaculation-frequency-prostate.mdx";
import * as a03 from "../../../content/learn/urge-surfing.mdx";
import * as a04 from "../../../content/learn/three-minute-puzzle.mdx";
import * as a05 from "../../../content/learn/one-slip-to-a-week.mdx";
import * as a06 from "../../../content/learn/if-then-plans.mdx";
import * as a07 from "../../../content/learn/late-nights-phones.mdx";
import * as a08 from "../../../content/learn/exercise-urge-tool.mdx";
import * as a09 from "../../../content/learn/compulsive-sexual-behaviour-help.mdx";
import * as a10 from "../../../content/learn/is-porn-addiction-real.mdx";
import * as a11 from "../../../content/learn/superpowers-claims-checked.mdx";
import * as a12 from "../../../content/learn/accountability-with-friends.mdx";

type MdxModule = { default: ComponentType; meta?: unknown };
const MODULES: [string, MdxModule][] = [
  ["day-7-testosterone-claim", a01],
  ["ejaculation-frequency-prostate", a02],
  ["urge-surfing", a03],
  ["three-minute-puzzle", a04],
  ["one-slip-to-a-week", a05],
  ["if-then-plans", a06],
  ["late-nights-phones", a07],
  ["exercise-urge-tool", a08],
  ["compulsive-sexual-behaviour-help", a09],
  ["is-porn-addiction-real", a10],
  ["superpowers-claims-checked", a11],
  ["accountability-with-friends", a12],
];

export type Article = ArticleMeta & { draft: boolean; Body: ComponentType };

/** Validated at import time: a missing grade, source or field throws and fails the build. */
export const ALL_ARTICLES: Article[] = MODULES.map(([file, mod]) => {
  const parsed = ArticleMeta.safeParse(mod.meta);
  if (!parsed.success) {
    throw new Error(`content/learn/${file}.mdx has invalid meta: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  if (parsed.data.slug !== file) throw new Error(`content/learn/${file}.mdx: slug must match the file name`);
  return { ...parsed.data, draft: isDraft(parsed.data), Body: mod.default };
});

/** Articles visible in this build (drafts only when previews are on). */
export function publishedArticles(): Article[] {
  const drafts = showDrafts();
  return ALL_ARTICLES.filter((a) => drafts || !a.draft);
}

export function getArticle(slug: string): Article | null {
  return publishedArticles().find((a) => a.slug === slug) ?? null;
}

export type ArticleCardData = Pick<Article, "slug" | "title" | "summary" | "evidence" | "readMinutes" | "draft">;
export function articleCards(): ArticleCardData[] {
  return publishedArticles().map(({ slug, title, summary, evidence, readMinutes, draft }) => ({ slug, title, summary, evidence, readMinutes, draft }));
}
