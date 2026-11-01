"use client";
import { elapsed, shortDate } from "@/lib/time";
import { Housing } from "./Housing";
import { Lamps } from "./Lamps";
import { LedReadout } from "./LedReadout";

/**
 * The signature: a gym interval timer. Computes from timestamps every render
 * (never an incrementing counter). Pre-season it counts down with the amber lamp.
 */
export function Clock({
  start,
  now,
  day,
  goalDays,
  endsOn,
  checkedIn,
  preseason,
  roundActive = false,
  housingStyle,
}: {
  start: Date | null;
  now: Date | null;
  day: number;
  goalDays: number;
  endsOn: string | null;
  checkedIn: boolean;
  preseason: boolean;
  roundActive?: boolean;
  housingStyle?: React.CSSProperties;
}) {
  const e = start && now ? (preseason ? elapsed(now, start) : elapsed(start, now)) : null;
  const groups = e ? [e.days, e.hours, e.minutes, e.seconds] : ["00", "00", "00", "00"];
  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="display text-[64px] leading-[56px]">{preseason ? "STARTS IN" : `DAY ${day || 1}`}</span>
        {!preseason && endsOn && (
          <span className="pb-1 text-[13px] leading-[18px] text-text-2">
            of {goalDays}, ends {shortDate(endsOn)}
          </span>
        )}
      </div>
      <Housing className="mt-3 px-4 pb-4 pt-6" style={housingStyle}>
        <div className="flex items-center gap-4">
          <Lamps go={!preseason && checkedIn} warn={preseason || !checkedIn} red={roundActive} />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="origin-left scale-[0.86] min-[380px]:scale-100">
              <LedReadout
                groups={groups}
                labels={["d", "h", "m", "s"]}
                size={44}
                ariaLabel={
                  e
                    ? `${preseason ? "Starts in" : "Streak"} ${e.days} days ${e.hours} hours ${e.minutes} minutes`
                    : "Clock"
                }
              />
            </div>
          </div>
        </div>
      </Housing>
    </div>
  );
}
