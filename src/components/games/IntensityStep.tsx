"use client";
import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { Keypad } from "@/components/ui/Keypad";
import { Button } from "@/components/ui/Button";

/** R1 / R4: 1-10 keypad with a plain Skip. Picking a number moves on immediately. */
export function IntensityStep({ title, onPick, closeHref }: { title: string; onPick: (n: number | null) => void; closeHref?: string }) {
  return (
    <div className="pt-safe flex min-h-dvh flex-col px-4 pb-safe min-[414px]:px-5">
      <div className="flex h-11 items-center justify-end">
        {closeHref && (
          <Link href={closeHref} aria-label="Close" className="press -mr-2 flex h-11 w-11 items-center justify-center text-text">
            <X weight="bold" size={22} />
          </Link>
        )}
      </div>
      <h1 className="display text-[40px] leading-[40px]">{title}</h1>
      <div className="mt-auto pb-6">
        <Keypad value={null} onChange={(n) => onPick(n)} />
        <Button variant="plain" className="mt-4 w-full" onClick={() => onPick(null)}>
          Skip
        </Button>
      </div>
    </div>
  );
}
