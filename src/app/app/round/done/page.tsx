import type { Metadata } from "next";
import { RoundDone } from "@/components/games/RoundDone";

export const metadata: Metadata = { title: "Round" };

export default function RoundDonePage() {
  return <RoundDone />;
}
