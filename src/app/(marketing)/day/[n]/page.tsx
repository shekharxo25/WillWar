import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicChrome } from "@/components/learn/PublicChrome";
import { DAY_TIPS, nextMilestone } from "@/lib/learn/days";

export function generateStaticParams() {
  return DAY_TIPS.map((_, i) => ({ n: String(i + 1) }));
}

function parse(n: string): number | null {
  const d = Number(n);
  return Number.isInteger(d) && d >= 1 && d <= 30 ? d : null;
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const d = parse((await params).n);
  return d ? { title: `Day ${d} of 30`, description: DAY_TIPS[d - 1] } : {};
}

export default async function DayPage({ params }: { params: Promise<{ n: string }> }) {
  const day = parse((await params).n);
  if (!day) notFound();
  const next = nextMilestone(day);
  return (
    <PublicChrome>
      <h1 className="display text-[64px] leading-[56px]">DAY {day}</h1>
      <p className="mt-1 text-[13px] leading-[18px] text-text-2">of 30</p>
      <section className="mt-6 rounded-card bg-raised p-5">
        <h2 className="text-[13px] leading-[18px] text-text-2">Today&apos;s tip</h2>
        <p className="mt-2 text-[17px] leading-[26px]">{DAY_TIPS[day - 1]}</p>
      </section>
      <p className="mt-6 text-[17px] leading-[26px] text-text-2">
        {next ? (next === 30 ? `Next: the belt at day 30, ${30 - day} ${30 - day === 1 ? "day" : "days"} away.` : `Next plate: day ${next}, ${next - day} ${next - day === 1 ? "day" : "days"} away.`) : "That's the full 30. The record stays on the wall."}
      </p>
      <nav className="mt-8 flex justify-between text-[15px] leading-5" aria-label="Days">
        {day > 1 ? <Link className="press flex min-h-[44px] items-center underline underline-offset-4" href={`/day/${day - 1}`}>Day {day - 1}</Link> : <span />}
        {day < 30 ? <Link className="press flex min-h-[44px] items-center underline underline-offset-4" href={`/day/${day + 1}`}>Day {day + 1}</Link> : <span />}
      </nav>
    </PublicChrome>
  );
}
