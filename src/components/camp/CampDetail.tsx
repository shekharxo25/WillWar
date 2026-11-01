"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DotsThree, UserPlus } from "@phosphor-icons/react";
import { useApp, useNow } from "@/components/AppProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { isPro } from "@/lib/store/engine";
import { localDate } from "@/lib/time";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { BoardRow, Camp, Challenge } from "@/lib/store/types";
import { Board } from "./Board";
import { activeChallenge, challengeLabel, metricDefinition, METRICS, rankBoard, type Metric, type RankedRow } from "./board";
import { CampMenuSheet, ChallengeSheet, InviteSheet, MemberSheet } from "./sheets";

/** C4 camp home. */
export function CampDetail() {
  const { id } = useParams<{ id: string }>();
  const { store, snap, loading } = useApp();
  const router = useRouter();
  const now = useNow(15_000);
  const [camp, setCamp] = useState<Camp | null | undefined>(undefined);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>("current");
  const [member, setMember] = useState<RankedRow | null>(null);
  const [sheet, setSheet] = useState<null | "invite" | "member" | "challenge" | "menu">(null);

  const load = useCallback(async () => {
    try {
      const camps = await store.listCamps();
      const c = camps.find((x) => x.id === id) ?? null;
      setCamp(c);
      if (!c) return;
      const [b, ch] = await Promise.all([store.campLeaderboard(id), store.listChallenges(id)]);
      setRows(b);
      setChallenges(ch);
      setUpdatedAt(Date.now());
    } catch {
      setCamp((prev) => prev ?? null);
    }
  }, [store, id]);

  useEffect(() => {
    // Fetch once the profile exists; setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (snap) void load();
  }, [snap, load]);

  // Realtime: private broadcast channel per camp; payload is only {type:"refresh"}.
  useEffect(() => {
    if (store.mode !== "cloud") return;
    const sb = supabaseBrowser();
    if (!sb) return;
    const ch = sb
      .channel(`camp:${id}`, { config: { private: true } })
      .on("broadcast", { event: "refresh" }, () => void load())
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
  }, [store.mode, id, load]);

  const tz = snap?.profile.timezone ?? "Asia/Kolkata";
  const today = now ? localDate(now, tz) : null;
  const ranked = useMemo(() => (today ? rankBoard(rows, metric, today) : []), [rows, metric, today]);
  const pro = !!snap && !!now && isPro(snap.entitlement, now);
  const isOwner = !!camp && camp.ownerId === snap?.profile.id;
  const challenge = now ? activeChallenge(challenges, now) : null;

  if (loading || !snap || camp === undefined) {
    return (
      <Screen title="CAMP" back="/app/camp">
        <div className="space-y-3" aria-busy="true">
          <div className="skeleton h-[72px]" />
          <div className="skeleton h-[34px]" />
          <div className="skeleton h-[240px]" />
        </div>
      </Screen>
    );
  }
  if (camp === null) {
    return (
      <Screen title="CAMP" back="/app/camp">
        <p className="text-[17px] leading-[22px]">This camp isn&apos;t on your list. It may have been left or removed.</p>
        <ButtonLink href="/app/camp" variant="secondary" className="mt-6">Back to Camp</ButtonLink>
      </Screen>
    );
  }

  const updated = updatedAt && now ? Math.floor((now.getTime() - updatedAt) / 60000) : 0;
  const count = rows.length;

  return (
    <Screen
      title={camp.name.toUpperCase()}
      back="/app/camp"
      trailing={
        <button type="button" aria-label="Camp options" onClick={() => setSheet("menu")} className="press flex h-11 w-11 items-center justify-center">
          <DotsThree size={26} weight="bold" />
        </button>
      }
    >
      <p className="-mt-2 text-[15px] leading-5 text-text-2">
        {count} {count === 1 ? "member" : "members"}, up to {camp.maxMembers}
      </p>

      <div className="mt-4 rounded-card bg-raised p-5">
        {challenge ? (
          <>
            <p className="text-[13px] leading-[18px] text-text-2">Challenge</p>
            <p className="mt-1 text-[17px] leading-[22px] font-semibold">{challengeLabel(challenge, tz)}</p>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] leading-5 text-text-2">No challenge running.</p>
            <Button variant="plain" className="shrink-0 font-semibold" onClick={() => setSheet("challenge")}>
              New challenge
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Segmented label="Board" value={metric} onChange={setMetric} options={METRICS} />
        <p className="mt-2 text-[13px] leading-[18px] text-text-2">{metricDefinition(metric, !!camp.seasonId)}</p>
      </div>

      <div className="mt-4">
        {ranked.length ? (
          <Board
            rows={ranked}
            metric={metric}
            onNudge={(r) => {
              setMember(r);
              setSheet("member");
            }}
          />
        ) : (
          <p className="rounded-card bg-raised p-5 text-[15px] leading-5 text-text-2">Nobody on the board yet. People who keep their streak private don&apos;t show here.</p>
        )}
        <p className="mt-2 px-4 text-[13px] leading-[18px] text-text-2">{updated < 1 ? "Updated just now" : `Updated ${updated} min ago`}</p>
        {camp.demo && <p className="mt-1 px-4 text-[13px] leading-[18px] text-text-3">Demo members. Sign in with a cloud account to invite real friends.</p>}
      </div>

      <div className="mt-6">
        <Button variant="secondary" onClick={() => setSheet("invite")}>
          <UserPlus size={20} weight="bold" aria-hidden />
          Invite friends
        </Button>
      </div>

      <InviteSheet open={sheet === "invite"} onOpenChange={(o) => setSheet(o ? "invite" : null)} camp={camp} />
      <MemberSheet open={sheet === "member"} onOpenChange={(o) => setSheet(o ? "member" : null)} camp={camp} member={member} isOwner={isOwner} onChanged={load} />
      <ChallengeSheet open={sheet === "challenge"} onOpenChange={(o) => setSheet(o ? "challenge" : null)} campId={camp.id} pro={pro} onCreated={load} />
      <CampMenuSheet
        open={sheet === "menu"}
        onOpenChange={(o) => setSheet(o ? "menu" : null)}
        camp={camp}
        isOwner={isOwner}
        onInvite={() => setSheet("invite")}
        onLeft={() => router.replace("/app/camp")}
        onChanged={load}
      />
    </Screen>
  );
}
