import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "@/components/illustrations";

export const metadata: Metadata = { title: "Offline" };

/** Precached by the service worker; shown when an app page can't load without a connection. */
export default function Offline() {
  return (
    <main className="pt-safe flex min-h-dvh flex-col justify-center px-4 min-[414px]:px-5">
      <Bell size={88} className="text-text-2" />
      <h1 className="display mt-6 text-[40px] leading-[40px]">OFFLINE</h1>
      <p className="mt-3 text-[17px] leading-[22px] text-text-2">
        Offline. Your clock keeps running; check-ins sync when you&apos;re back.
      </p>
      <Link
        href="/app/today"
        className="press mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-button bg-primary text-[17px] leading-[22px] font-semibold text-on-primary"
      >
        Open Today
      </Link>
    </main>
  );
}
