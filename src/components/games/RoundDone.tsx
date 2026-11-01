"use client";
import { useState } from "react";
import { useMounted } from "./useMounted";
import { useRouter } from "next/navigation";
import { ChatCircle, PersonSimpleRun, UsersThree } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Cell, CellGroup } from "@/components/ui/Cell";
import { isPro } from "@/lib/store/engine";
import { roundsLasted } from "@/lib/store/derive";
import { StoreError } from "@/lib/store/types";
import { readRound, sessionRounds, writeRound, type RoundState } from "./roundState";
import { PostRoundGate, RewardedShield } from "./RoundAds";

/** R5: before → after, rounds lasted, next steps. */
export function RoundDone() {
  const { snap, store, refresh, toast } = useApp();
  const router = useRouter();
  const mounted = useMounted();
  const [gate, setGate] = useState(false);

  if (!mounted) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  const r: RoundState = readRound() ?? { before: null };
  const pro = !!snap && isPro(snap.entitlement, new Date());

  const lasted = snap ? roundsLasted(snap) : sessionRounds();
  const high = (r.after ?? 0) >= 8;
  const hasScores = r.before != null || r.after != null;

  const another = () => {
    // The next round starts from how strong it is now.
    writeRound({ before: r.after ?? r.before ?? null });
    const go = () => router.push("/app/round?again=1");
    let shown = true;
    try {
      shown = pro || sessionStorage.getItem("ww.postRoundAd") === "1";
      if (!shown) sessionStorage.setItem("ww.postRoundAd", "1");
    } catch {}
    if (shown) go();
    else setGate(true);
  };

  const grant = async () => {
    try {
      await store.grantShield("rewarded_ad");
      await refresh();
      toast("Shield earned.");
    } catch (e) {
      toast(e instanceof StoreError && e.code === "shield_cap" ? "That's this week's two shields." : "Couldn't add the shield. Try later.");
    }
  };

  return (
    <div className="pt-safe flex min-h-dvh flex-col px-4 pb-safe min-[414px]:px-5">
      <div className="h-11" />
      <h1 className="display text-[40px] leading-[40px]">{r.completed ? "YOU WENT THE DISTANCE." : "YOU SHOWED UP."}</h1>
      {!r.completed && <p className="mt-2 text-[17px] leading-[22px] text-text-2">Ending early still counts as facing it.</p>}

      {hasScores && (
        <p className="display mt-8 text-[64px] leading-[56px]" aria-label={`Before ${r.before ?? "skipped"}, after ${r.after ?? "skipped"}`}>
          {r.before ?? "–"} <span className="text-text-3">→</span> {r.after ?? "–"}
        </p>
      )}
      <p className="mt-4 text-[17px] leading-[22px]">Rounds lasted: {lasted}</p>
      {r.summary && (
        <p className="mt-1 text-[15px] leading-5 text-text-2">
          {r.summary.label}: {r.summary.value}
        </p>
      )}

      {high && (
        <div className="mt-8">
          <CellGroup header="Still strong. One more move.">
            <Cell icon={<UsersThree size={22} weight="bold" />} title="Send your camp a nudge" href="/app/camp" />
            <Cell icon={<ChatCircle size={22} weight="bold" />} title="Talk it through" value={pro ? undefined : "Pro"} href="/app/coach" />
            <Cell icon={<PersonSimpleRun size={22} weight="bold" />} title="Get up and move" subtitle="20 squats or a walk outside" />
          </CellGroup>
        </div>
      )}

      <div className="mt-auto space-y-3 pb-6 pt-8">
        <ButtonLink href="/app/today">Back to Today</ButtonLink>
        <Button variant="secondary" onClick={another}>
          Go another round
        </Button>
        {!high && !pro && snap && <RewardedShield onGrant={grant} />}
      </div>
      {gate && <PostRoundGate onDone={() => router.push("/app/round?again=1")} />}
    </div>
  );
}
