import type { Metadata } from "next";
import { StaticPage } from "@/components/landing/StaticPage";

export const metadata: Metadata = { title: "War Chest report" };

export default function WarChestReport() {
  return (
    <StaticPage title="War Chest report">
      <p>
        Each month we total the War Chest money that went to each cause and donate it, then publish the amount and the
        receipt here. WillWar never keeps any of it.
      </p>
      <div className="rounded-card bg-raised p-5">
        <p className="font-semibold">No donations yet.</p>
        <p className="mt-1 text-text-2">
          The War Chest runs in promise mode right now: no money moves through WillWar, and people who reset donate their
          share directly. This page lists monthly totals and receipts once money moves through WillWar.
        </p>
      </div>
    </StaticPage>
  );
}
