import type { Metadata } from "next";
import { WarChest } from "@/components/war-chest/WarChest";

export const metadata: Metadata = { title: "War Chest" };

export default function WarChestPage() {
  return <WarChest />;
}
