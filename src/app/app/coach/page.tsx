import type { Metadata } from "next";
import { CoachScreen } from "@/components/safety/CoachScreen";

export const metadata: Metadata = { title: "Talk it through" };

export default function CoachPage() {
  return <CoachScreen />;
}
