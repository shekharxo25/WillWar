"use client";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/components/AppProvider";
import { longDate } from "@/lib/time";

/** W1: the one-time offer. Equal-width buttons. Never at a vulnerable moment (checked server-side). */
export function WarChestOffer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { snap } = useApp();
  const router = useRouter();
  const end = snap?.goal?.endsOn;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="BACK YOUR PLEDGE?"
      description={`Put an amount behind it. Each reset sends a quarter to a cause you pick. Make it to ${end ? longDate(end) : "the end"} and whatever's left comes back to you.`}
    >
      <p className="text-[17px] leading-[22px]">WillWar never keeps any of it.</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Not now</Button>
        <Button onClick={() => { onOpenChange(false); router.push("/app/war-chest"); }}>Set up my War Chest</Button>
      </div>
      <p className="mt-4 text-[13px] leading-[18px] text-text-2">We&apos;ll only ask once. You&apos;ll find it in Me if you change your mind.</p>
    </Sheet>
  );
}
