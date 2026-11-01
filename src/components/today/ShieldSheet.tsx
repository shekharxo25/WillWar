"use client";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { shortDate } from "@/lib/time";

/** Shields cover a missed check-in inside an unbroken streak. Never a reset. */
export function ShieldSheet({ open, onOpenChange, days }: { open: boolean; onOpenChange: (o: boolean) => void; days: string[] }) {
  const { store, refresh, toast } = useApp();
  const [day, setDay] = useState<string | null>(days[0] ?? null);
  const use = async () => {
    if (!day) return;
    try {
      await store.spendShield(day);
      toast(`Shield used for ${shortDate(day)}.`);
      await refresh();
      onOpenChange(false);
    } catch {
      toast("That day can't take a shield.");
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="USE A SHIELD" description="A shield covers a day you held but didn't check in. It never covers a reset.">
      <div className="flex flex-wrap gap-2">
        {days.map((d) => (
          <Chip key={d} selected={day === d} onClick={() => setDay(d)}>{shortDate(d)}</Chip>
        ))}
      </div>
      <Button className="mt-6" disabled={!day} onClick={use}>Use a shield</Button>
    </Sheet>
  );
}
