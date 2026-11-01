import type { Metadata } from "next";
import { CoachChat } from "./CoachChat";

export const metadata: Metadata = { title: "Talk it through" };

export default function CoachPage() {
  return <CoachChat />;
}
