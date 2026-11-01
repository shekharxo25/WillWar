import type { Metadata } from "next";
import { Suspense } from "react";
import { GameRoute } from "@/components/games/GameRoute";

export const metadata: Metadata = { title: "Ride it out" };

export default function GamePage({ params }: PageProps<"/app/urge/[game]">) {
  return (
    <Suspense>
      <GameRoute params={params} />
    </Suspense>
  );
}
