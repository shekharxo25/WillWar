import { TabShell } from "@/components/shell/TabShell";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return <TabShell>{children}</TabShell>;
}
