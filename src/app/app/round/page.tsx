import type { Metadata } from "next";
import { RoundStart } from "@/components/games/RoundStart";

export const metadata: Metadata = { title: "Round" };

export default function RoundPage() {
  return <RoundStart />;
}
