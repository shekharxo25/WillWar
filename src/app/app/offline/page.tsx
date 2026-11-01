import { WifiSlash } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline" };

// Precached by the service worker; shown when a page can't load without a connection.
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <WifiSlash size={40} className="text-tide" aria-hidden />
      <h1 className="mt-4 text-title-2 font-bold">You&apos;re offline.</h1>
      <p className="mt-2 max-w-[34ch] text-body text-label-2">
        Your clock keeps running; check-ins sync when you&apos;re back.
      </p>
      <Link href="/app/today" className="pressable mt-6 inline-flex h-[50px] items-center rounded-btn bg-tide px-6 text-headline font-semibold text-on-tide">
        Open Today
      </Link>
    </main>
  );
}
