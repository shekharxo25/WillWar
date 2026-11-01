import type { Metadata } from "next";
import { SettingsScreen } from "@/components/me/SettingsScreen";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsScreen />;
}
