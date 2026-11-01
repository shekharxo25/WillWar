import type { Metadata } from "next";
import { GlobalBoardScreen } from "@/components/pact/PactScreens";

export const metadata: Metadata = { title: "Global board" };

export default function GlobalBoardPage() {
  return <GlobalBoardScreen />;
}
