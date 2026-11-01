"use client";
import { useApp } from "@/components/AppProvider";

export function OfflineBanner() {
  const { online } = useApp();
  if (online) return null;
  return (
    <div role="status" className="pt-safe sticky top-0 z-50 bg-raised px-4 py-2 text-[13px] leading-[18px] text-text-2">
      Offline. Your clock keeps running; check-ins sync when you&apos;re back.
    </div>
  );
}
