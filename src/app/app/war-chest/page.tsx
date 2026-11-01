import type { Metadata } from "next";
import { WarChestScreen } from "@/components/war-chest/WarChestScreen";

export const metadata: Metadata = { title: "War Chest" };

export default function WarChestPage() {
  return <WarChestScreen />;
}
