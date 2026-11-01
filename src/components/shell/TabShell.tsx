"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AppProvider";
import { TabBar } from "./TabBar";
import { GoRoundButton } from "./GoRoundButton";
import { OfflineBanner } from "./OfflineBanner";

const GO_ROUND_ON = ["/app/today", "/app/camp", "/app/learn"];

/** Tab chrome. Sends people without a record to onboarding. */
export function TabShell({ children }: { children: React.ReactNode }) {
  const { snap, loading } = useApp();
  const router = useRouter();
  const path = usePathname();
  const publicTab = path.startsWith("/app/learn");
  useEffect(() => {
    if (!loading && !snap && !publicTab) router.replace("/app/start");
  }, [loading, snap, publicTab, router]);
  const showGo = GO_ROUND_ON.some((p) => path === p || path.startsWith(p + "/"));
  return (
    <>
      <OfflineBanner />
      {children}
      {showGo && <GoRoundButton />}
      <TabBar />
    </>
  );
}
