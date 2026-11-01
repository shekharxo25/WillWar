import type { Metadata } from "next";
import { UrgeDone } from "@/components/games/UrgeDone";

export const metadata: Metadata = { title: "Wave passed" };

export default function UrgeDonePage() {
  return <UrgeDone />;
}
