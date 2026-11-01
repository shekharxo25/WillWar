import { Suspense } from "react";
import { TabShell } from "@/components/shell/TabShell";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <TabShell>{children}</TabShell>
    </Suspense>
  );
}
