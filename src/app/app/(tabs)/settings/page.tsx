import type { Metadata } from "next";
import { Settings } from "@/components/me/Settings";

export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() {
  return <Settings />;
}
