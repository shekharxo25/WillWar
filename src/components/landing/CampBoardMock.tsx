"use client";
import { useState } from "react";
import { LockerPlate } from "@/components/ui/LockerPlate";
import { Segmented } from "@/components/ui/Segmented";

type Metric = "current" | "best" | "days";
const ROWS = [
  { handle: "rohan_k", seed: "a1b2c3", current: 14, best: 14, days: 14 },
  { handle: "dev_s", seed: "d4e5f6", current: 6, best: 9, days: 12 },
  { handle: "you", seed: "you-seed", current: 9, best: 9, days: 9, me: true },
  { handle: "quietmile", seed: "778899", current: 3, best: 11, days: 10 },
];
const DEFS: Record<Metric, string> = {
  current: "Time since each person's last reset.",
  best: "Longest streak during No Nut November 2026.",
  days: "Days checked in as held during the season.",
};

export function CampBoardMock() {
  const [m, setM] = useState<Metric>("current");
  const rows = [...ROWS].sort((a, b) => b[m] - a[m]);
  return (
    <div className="w-full max-w-[420px] rounded-card bg-raised p-4">
      <Segmented
        label="Board"
        value={m}
        onChange={setM}
        options={[
          { value: "current", label: "Current" },
          { value: "best", label: "Best" },
          { value: "days", label: "Days" },
        ]}
      />
      <p className="mt-3 text-[13px] leading-[18px] text-text-2">{DEFS[m]}</p>
      <ol className="mt-3">
        {rows.map((r, i) => (
          <li
            key={r.handle}
            className={`relative flex h-[52px] items-center gap-3 rounded-[4px] px-3 ${r.me ? "bg-leather-wash" : ""}`}
          >
            {r.me && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-led" />}
            <span className="display w-5 text-[22px] leading-none text-text-3">{i + 1}</span>
            <LockerPlate seed={r.seed} />
            <span className="min-w-0 flex-1 truncate text-[17px] leading-[22px]">
              {r.handle}
              {r.me && <span className="sr-only"> (your row)</span>}
            </span>
            <span className="flex items-baseline gap-1">
              <span className="display text-[30px] leading-none">{r[m]}</span>
              <span className="text-[13px] leading-[18px] text-text-2">d</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
