import type { Metadata } from "next";
import { UrgeStart } from "@/components/games/UrgeStart";

export const metadata: Metadata = { title: "Ride it out" };

export default function UrgePage() {
  return <UrgeStart />;
}
