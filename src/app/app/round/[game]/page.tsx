import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoundPlay } from "@/components/games/RoundPlay";
import { GAMES, isGame } from "@/components/games/types";

export const metadata: Metadata = { title: "Round" };

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.id }));
}

export default async function RoundGamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  if (!isGame(game)) notFound();
  return <RoundPlay game={game} />;
}
