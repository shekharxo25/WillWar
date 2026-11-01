import { z } from "zod";

export const EVIDENCE = ["strong", "moderate", "mixed", "myth"] as const;

/**
 * Article frontmatter (exported `meta` in each MDX file). Missing or malformed fields fail
 * the build: src/lib/learn/articles.ts parses every article at import time.
 */
export const ArticleMeta = z
  .object({
    title: z.string().min(8).max(120),
    slug: z.string().regex(/^[a-z0-9-]{3,80}$/),
    summary: z.string().min(20).max(240),
    evidence: z.enum(EVIDENCE),
    readMinutes: z.number().int().min(1).max(30),
    supports: z.string().min(20),
    doesnt: z.string().min(20),
    reviewed_by: z.string(),
    reviewed_on: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    sources: z
      .array(z.object({ label: z.string().min(10), url: z.string().url().optional() }).strict())
      .min(1, "every article needs at least one source"),
  })
  .strict()
  .refine((m) => (m.reviewed_by ? !!m.reviewed_on : true), { message: "reviewed_on is required when reviewed_by is set" });

export type ArticleMeta = z.infer<typeof ArticleMeta>;

export const isDraft = (m: Pick<ArticleMeta, "reviewed_by">) => m.reviewed_by.trim() === "";

/** Drafts are excluded unless NEXT_PUBLIC_SHOW_DRAFTS=1, or in development by default. */
export function showDrafts(env: { NODE_ENV?: string; NEXT_PUBLIC_SHOW_DRAFTS?: string } = process.env): boolean {
  if (env.NEXT_PUBLIC_SHOW_DRAFTS === "1") return true;
  if (env.NEXT_PUBLIC_SHOW_DRAFTS === "0") return false;
  return env.NODE_ENV !== "production";
}
