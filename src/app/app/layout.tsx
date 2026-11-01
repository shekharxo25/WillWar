import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";

// Discreet by default: in-app titles never mention the challenge subject.
export const metadata: Metadata = { title: { default: "WillWar", template: "%s · WillWar" }, robots: { index: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
    </AppProvider>
  );
}
