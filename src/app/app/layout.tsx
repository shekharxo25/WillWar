import type { Metadata } from "next";
import { AppProviders } from "@/components/app/AppProviders";

// Discreet by default: in-app page titles never mention the challenge's subject.
export const metadata: Metadata = {
  title: { default: "WillWar", template: "%s · WillWar" },
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppProviders>{children}</AppProviders>;
}
