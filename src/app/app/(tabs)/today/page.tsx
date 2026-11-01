import type { Metadata } from "next";
import { Today } from "@/components/today/Today";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <Today />;
}
