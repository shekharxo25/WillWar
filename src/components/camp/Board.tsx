"use client";
import { LockerPlate } from "@/components/ui/LockerPlate";
import { formatMetric, type Metric, type RankedRow } from "./board";

/**
 * Board rows: rank in League Gothic 22 --text-3; locker plate; handle; value League Gothic 30
 * with a system 13 unit. My row: 3px LED bar + leather wash. Stale rows show "Paused".
 */
export function Board({ rows, metric, onNudge }: { rows: RankedRow[]; metric: Metric; onNudge?: (r: RankedRow) => void }) {
  return (
    <ol className="overflow-hidden rounded-card bg-raised" aria-label="Board">
      {rows.map((r, i) => {
        const v = formatMetric(r, metric);
        return (
          <li
            key={r.memberId}
            className={`relative flex min-h-[60px] items-center gap-3 py-2 pl-4 pr-2 ${r.isMe ? "bg-leather-wash" : ""}`}
            aria-current={r.isMe ? "true" : undefined}
          >
            {i > 0 && <span aria-hidden className="absolute left-4 right-0 top-0 h-[0.5px] bg-[var(--hairline)]" />}
            {r.isMe && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-led" />}
            <span className="display w-6 shrink-0 text-center text-[22px] leading-none text-text-3">{r.rank}</span>
            <LockerPlate seed={r.avatarSeed} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] leading-[22px]">
                {r.handle}
                {r.isMe && <span className="text-text-2"> (you)</span>}
              </span>
              {(r.paused || r.isBacked) && (
                <span className="block text-[13px] leading-[18px] text-text-2">
                  {[r.paused ? "Paused" : null, r.isBacked ? "Backed" : null].filter(Boolean).join(", ")}
                </span>
              )}
            </span>
            <span className={`flex shrink-0 items-baseline gap-1 ${r.paused ? "text-text-3" : ""}`}>
              <span className="display text-[30px] leading-none">{v.value}</span>
              <span className="text-[13px] leading-[18px]">{v.unit}</span>
            </span>
            {onNudge && !r.isMe ? (
              <button type="button" onClick={() => onNudge(r)} className="press min-h-[44px] shrink-0 px-2 text-[15px] leading-5 font-semibold">
                Nudge
              </button>
            ) : (
              <span className="w-[62px] shrink-0" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
