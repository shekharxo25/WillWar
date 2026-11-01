"use client";
import { useEffect, useState } from "react";
import { Housing } from "@/components/clock/Housing";
import { Lamps } from "@/components/clock/Lamps";
import { LedReadout } from "@/components/clock/LedReadout";
import { FitWidth } from "@/components/clock/FitWidth";
import { elapsed } from "@/lib/time";

/** A live LED strip counting from zero since the page loaded. Computed from a timestamp each tick. */
export function LiveLed() {
  const [t, setT] = useState<{ start: number; now: number } | null>(null);
  useEffect(() => {
    const start = Date.now();
    const tick = () => setT({ start, now: Date.now() });
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const e = t ? elapsed(t.start, t.now) : null;
  return (
    <Housing className="flex w-full max-w-[420px] items-center gap-4 px-4 pb-3 pt-5">
      <Lamps go={!!e} />
      <div className="min-w-0 flex-1">
        <FitWidth>
        <LedReadout
          groups={e ? [e.days, e.hours, e.minutes, e.seconds] : ["00", "00", "00", "00"]}
          labels={["d", "h", "m", "s"]}
          size={36}
          ariaLabel={e ? `Running for ${e.minutes} minutes ${e.seconds} seconds` : "Clock"}
        />
        </FitWidth>
      </div>
    </Housing>
  );
}
