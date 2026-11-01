import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/learn", "/privacy", "/terms", "/health", "/support", "/war-chest/report"];
  const days = Array.from({ length: 30 }, (_, i) => `/day/${i + 1}`);
  return [...paths, ...days].map((p) => ({ url: `${site}${p}`, changeFrequency: p === "/" ? "weekly" : "monthly", priority: p === "/" ? 1 : 0.5 }));
}
