import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/landing/StaticPage";

export const metadata: Metadata = { title: "Health disclaimer" };

export default function Health() {
  return (
    <StaticPage title="Health disclaimer">
      <p>WillWar is a habit and streak tracker. It is not medical advice and doesn&apos;t diagnose or treat anything.</p>
      <p>
        We don&apos;t claim that taking a 30-day break changes your body. Articles in Learn show how strong the evidence is
        for each topic, with sources.
      </p>
      <p>
        If urges or habits are causing you distress or hurting your life, talk to a doctor or counselor. If you&apos;re
        thinking about harming yourself, <Link href="/support">reach someone now</Link>.
      </p>
    </StaticPage>
  );
}
