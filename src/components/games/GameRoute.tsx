"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { GAMES, type Game, PRO_GAMES } from "@/lib/domain/constants";
import { useWillWar } from "@/lib/store/provider";
import { GameHost } from "./GameHost";

/** Validates the game param; free people can't open Knots directly. */
export function GameRoute({ params }: { params: Promise<{ game: string }> }) {
  const { game } = use(params);
  const router = useRouter();
  const { isPro, status } = useWillWar();
  const valid = (GAMES as readonly string[]).includes(game);
  const locked = valid && PRO_GAMES.includes(game as Game) && !isPro && status !== "loading";

  useEffect(() => {
    if (!valid || locked) router.replace("/app/urge");
  }, [valid, locked, router]);

  if (!valid || locked || (PRO_GAMES.includes(game as Game) && status === "loading")) return null;
  return <GameHost game={game as Game} />;
}
