"use client";
import { useCallback, useEffect, useState } from "react";
import { useApp, useNow } from "@/components/AppProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { SEASON } from "@/lib/config/season";
import { localDate } from "@/lib/time";
import type { BoardRow } from "@/lib/store/types";
import { Board } from "./Board";
import { metricDefinition, METRICS, rankBoard, type Metric } from "./board";

type GlobalRow = { rank: number; member_id: string; handle: string; avatar_seed: string; current_streak_s: number; best_streak_s: number; days_kept: number; last_checkin: string | null; is_me: boolean };

/** C7: opt-in season board. Top 100 handles, my rank pinned. */
export function GlobalBoard() {
  const { store, snap } = useApp();
  const now = useNow(60_000);
  const [metric, setMetric] = useState<Metric>("current");
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data, error: e } = await sb.rpc("season_leaderboard", { p_season: SEASON.id, p_metric: metric });
    if (e) {
      setError(true);
      return;
    }
    setRows(
      ((data ?? []) as GlobalRow[]).map((r) => ({
        memberId: r.member_id, handle: r.handle, avatarSeed: r.avatar_seed, currentStreakS: Number(r.current_streak_s),
        bestStreakS: Number(r.best_streak_s), daysKept: r.days_kept, lastCheckin: r.last_checkin, isBacked: false, isMe: r.is_me,
      })),
    );
  }, [metric]);

  useEffect(() => {
    // setState happens after the awaited RPC.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (store.mode === "cloud") void load();
  }, [store.mode, load]);

  const optedIn = snap?.profile.leaderboardVisibility === "global";
  const today = now && snap ? localDate(now, snap.profile.timezone) : null;
  const ranked = rows && today ? rankBoard(rows, metric, today) : [];
  const top = ranked.slice(0, 100);
  const me = ranked.find((r) => r.isMe && r.rank > 100);

  return (
    <Screen title="GLOBAL BOARD" back="/app/camp">
      <p className="-mt-2 text-[15px] leading-5 text-text-2">{SEASON.name}. Only people who chose Everyone appear here.</p>
      {store.mode === "device" ? (
        <div className="mt-6 rounded-card bg-raised p-5">
          <p className="text-[17px] leading-[22px]">The global board needs a cloud account. On this device your record never leaves the phone.</p>
          <ButtonLink href="/app/settings#privacy" variant="secondary" className="mt-5">Choose who sees your streak</ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Segmented label="Board" value={metric} onChange={setMetric} options={METRICS} />
            <p className="mt-2 text-[13px] leading-[18px] text-text-2">{metricDefinition(metric, true)}</p>
          </div>
          {!optedIn && (
            <div className="mt-4 rounded-card bg-raised p-5">
              <p className="text-[15px] leading-5">You&apos;re not on this board. Your streak shows to your camps only.</p>
              <ButtonLink href="/app/settings#privacy" variant="plain" className="mt-2 px-0 font-semibold">Choose who sees your streak</ButtonLink>
            </div>
          )}
          <div className="mt-4">
            {error ? (
              <p className="text-[15px] leading-5 text-text-2">The board didn&apos;t load. Pull down or try again in a minute.</p>
            ) : rows === null ? (
              <div className="skeleton h-[240px]" aria-busy="true" />
            ) : top.length ? (
              <>
                <Board rows={top} metric={metric} />
                {me && (
                  <div className="mt-3">
                    <Board rows={[me]} metric={metric} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-[15px] leading-5 text-text-2">Nobody here yet.</p>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}
