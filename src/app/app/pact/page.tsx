import type { Metadata } from "next";
import { PactHomeScreen } from "@/components/pact/PactScreens";

export const metadata: Metadata = { title: "Pact" };

export default function PactPage() {
  return <PactHomeScreen />;
}
