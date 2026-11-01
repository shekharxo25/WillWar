"use client";

import { ArrowLeft, DotsThree, HandWaving, ShareNetwork, ShieldCheck, Lock, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Gate } from "@/components/app/Gate";
import { CircleButton, LargeTitle } from "@/components/app/AppChrome";
import { Button } from "@/components/ui/Button";
import { Segmented, Switch } from "@/components/ui/Controls";
import { Cell, InsetGroup, Skeleton } from "@/components/ui/List";
import { useHud } from "@/components/ui/Hud";
import { Pebble } from "@/components/ui/Pebble";
import { Sheet } from "@/components/ui/Sheet";
import { cloudEnabled } from "@/env";
import { CURRENT_SEASON, NUDGE_KEYS, NUDGE_LABELS } from "@/lib/domain/constants";
import type { Snapshot } from "@/lib/domain/types";
import {
  type BoardRow,
  type Challenge,
  challenges as loadChallenges,
  createPact,
  inviteUrl,
  joinPact,
  leaderboard,
  leavePact,
  muteMember,
  myPacts,
  type PactSummary,
  type SeasonRow,
  seasonBoard,
  reportContent,
  sendNudge,
  subscribePact,
} from "@/lib/social/api";
import { useWillWar } from "@/lib/store/provider";
import { errorMessage } from "@/lib/store/types";
import { diffDays, formatDaysHours, formatShortDay, localDate } from "@/lib/time";

/** A calm sea line: the empty-state illustration. */
function CalmSea() {
  return (
    <svg viewBox="0 0 240 60" className="mx-auto h-14 w-56 text-tide" aria-hidden>
      <path d="M0 34 C 30 24, 50 44, 80 34 S 130 24, 160 34 S 210 44, 240 34" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 48 C 50 40, 70 56, 100 48 S 150 40, 180 48 S 220 54, 240 50" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

async function share(url: string, hud: (t: string) => void) {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  try {
    if (nav.share) await nav.share({ title: "WillWar", text: "Join my pact on WillWar.", url });
    else {
      await navigator.clipboard.writeText(url);
      hud("Link copied.");
    }
  } catch {
    // dismissed
  }
}

export function PactHomeScreen() {
  return <Gate>{(s) => <PactHome snapshot={s} />}</Gate>;
}

function PactHome({ snapshot }: { snapshot: Snapshot }) {
  const hud = useHud();
  if (!cloudEnabled || snapshot.mode === "device") {
    return (
      <main>
        <LargeTitle title="Pact" />
        <div className="px-4">
          <section className="rounded-sheet bg-surface p-8 text-center">
            <CalmSea />
            <h2 className="mt-4 text-title-2 font-bold">No pact yet.</h2>
            <p className="mt-2 text-body text-label-2">
              Pacts are small groups of friends who see each other&apos;s streaks. They need an online account, and this build
              keeps everything on your device.
            </p>
            <Button className="mt-6" full variant="secondary" icon={<ShareNetwork size={20} aria-hidden />} onClick={() => share(window.location.origin, hud)}>
              Tell a friend about WillWar
            </Button>
          </section>
          <p className="mt-4 px-2 text-center text-footnote text-label-2">Pacts see your number, never the reason it reset.</p>
        </div>
      </main>
    );
  }
  return <CloudPactHome />;
}

function CloudPactHome() {
  const router = useRouter();
  const { isPro } = useWillWar();
  const [pacts, setPacts] = useState<PactSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const load = useCallback(() => {
    myPacts()
      .then((p) => {
        setPacts(p);
        setError(null);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(load, [load]);

  return (
    <main>
      <LargeTitle title="Pact" />
      <div className="space-y-4 px-4">
        {error && <p className="rounded-cell bg-tertiary p-3 text-subhead">{error}</p>}
        {pacts === null && !error && <Skeleton className="h-32 w-full rounded-sheet" />}
        {pacts?.length === 0 && (
          <section className="rounded-sheet bg-surface p-8 text-center">
            <CalmSea />
            <h2 className="mt-4 text-title-2 font-bold">No pact yet.</h2>
            <p className="mt-2 text-body text-label-2">Pacts are small groups of friends who see each other&apos;s streaks.</p>
          </section>
        )}
        {pacts && pacts.length > 0 && (
          <InsetGroup header="Your pacts">
            {pacts.map((p) => (
              <Cell key={p.id} icon={<UsersThree size={18} aria-hidden />} title={p.name} subtitle={`${p.member_count} ${p.member_count === 1 ? "person" : "people"}`} href={`/app/pact/${p.id}`} />
            ))}
          </InsetGroup>
        )}
        <div className="grid gap-2">
          <Button full onClick={() => setStartOpen(true)} disabled={!isPro && (pacts?.filter((p) => p.is_owner).length ?? 0) >= 1}>
            Start a pact
          </Button>
          <Button full variant="secondary" onClick={() => setJoinOpen(true)}>
            Join with a code
          </Button>
          <Link href="/app/pact/global" className="pressable flex min-h-11 items-center justify-center text-subhead text-tide">
            See the global board
          </Link>
        </div>
      </div>
      <StartPactSheet open={startOpen} onOpenChange={setStartOpen} onCreated={(id) => router.push(`/app/pact/${id}`)} />
      <JoinSheet open={joinOpen} onOpenChange={setJoinOpen} onJoined={(id) => router.push(`/app/pact/${id}`)} />
    </main>
  );
}

function StartPactSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [season, setSeason] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Start a pact">
      <label className="block">
        <span className="text-footnote text-label-2">Pact name</span>
        <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className="mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-body ring-[0.5px] ring-separator" />
      </label>
      <div className="mt-4 flex items-center gap-3 rounded-cell bg-surface p-3">
        <span className="flex-1 text-body">Link to {CURRENT_SEASON.name}</span>
        <Switch label={`Link to ${CURRENT_SEASON.name}`} checked={season} onCheckedChange={setSeason} />
      </div>
      <p className="mt-3 text-footnote text-label-2">Free pacts hold up to 5 people. Pro holds up to 50.</p>
      {error && <p className="mt-2 text-footnote text-destructive">{error}</p>}
      <Button
        full
        className="mt-5"
        busy={busy}
        disabled={name.trim().length < 2}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            onCreated(await createPact(name.trim(), season ? CURRENT_SEASON.id : null));
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Start pact
      </Button>
    </Sheet>
  );
}

function JoinSheet({ open, onOpenChange, onJoined }: { open: boolean; onOpenChange: (v: boolean) => void; onJoined: (id: string) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Join with a code">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, ""))}
        autoCapitalize="none"
        aria-label="Invite code"
        className="num h-[52px] w-full rounded-cell bg-surface px-3 text-center text-[1.375rem] tracking-[0.2em] ring-[0.5px] ring-separator"
      />
      {error && <p className="mt-2 text-footnote text-destructive">{error === "invalid_code" ? "That code didn't match a pact." : error}</p>}
      <Button
        full
        className="mt-5"
        busy={busy}
        disabled={code.length < 6}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            onJoined(await joinPact(code));
          } catch (e) {
            setError(e instanceof Error && e.message === "pact_full" ? "That pact is full." : errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Join pact
      </Button>
    </Sheet>
  );
}

type Metric = "current" | "best" | "days";
const METRIC_LINE: Record<Metric, string> = {
  current: "Time since each person's last reset.",
  best: `Longest streak during ${CURRENT_SEASON.name}.`,
  days: "Days checked in as held during the season.",
};

export function PactDetailScreen({ id }: { id: string }) {
  return <Gate>{(s) => (cloudEnabled && s.mode === "cloud" ? <PactDetail id={id} snapshot={s} /> : <PactHome snapshot={s} />)}</Gate>;
}

function PactDetail({ id, snapshot }: { id: string; snapshot: Snapshot }) {
  const router = useRouter();
  const hud = useHud();
  const [pact, setPact] = useState<PactSummary | null>(null);
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [metric, setMetric] = useState<Metric>("current");
  const [nudgeTo, setNudgeTo] = useState<BoardRow | null>(null);
  const [menuFor, setMenuFor] = useState<BoardRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    Promise.all([myPacts(), leaderboard(id), loadChallenges(id)])
      .then(([pacts, board, ch]) => {
        const p = pacts.find((x) => x.id === id) ?? null;
        if (!p) return router.replace("/app/pact");
        setPact(p);
        setRows(board);
        setChallenge(ch[0] ?? null);
        setUpdatedAt(new Date());
      })
      .catch((e) => hud(errorMessage(e)));
  }, [id, router, hud]);

  useEffect(() => {
    load();
    const unsub = subscribePact(id, load);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
    };
  }, [id, load]);

  const today = localDate(new Date(), snapshot.profile.timezone);
  const value = (r: BoardRow) => (metric === "current" ? r.current_streak_s : metric === "best" ? r.best_streak_s : r.days_kept);
  const sorted = [...(rows ?? [])].sort((a, b) => value(b) - value(a));
  const paused = (r: BoardRow) => !r.last_checkin || diffDays(r.last_checkin, today) > 2;

  return (
    <main>
      <div className="flex items-center justify-between px-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <Link href="/app/pact" className="pressable flex min-h-11 items-center gap-1 px-2 text-body text-tide">
          <ArrowLeft size={18} aria-hidden /> Pacts
        </Link>
        <CircleButton label="Invite" onClick={() => setInviteOpen(true)}>
          <ShareNetwork size={20} aria-hidden />
        </CircleButton>
      </div>
      <div className="px-4">
        <h1 className="text-large-title font-bold">{pact?.name ?? " "}</h1>
        <p className="text-subhead text-label-2">
          {pact ? `${pact.member_count} ${pact.member_count === 1 ? "person" : "people"}` : ""}
          {updatedAt && <span className="ml-2 text-footnote">Updated just now</span>}
        </p>
      </div>
      <div className="mt-4 space-y-4 px-4">
        {challenge && (
          <section className="rounded-sheet bg-surface p-5">
            <p className="text-headline">
              {challenge.kind === "first_to_days" ? `First to ${challenge.target_days} days` : challenge.kind === "longest_streak" ? "Longest streak" : "Most days kept"}
            </p>
            <p className="text-subhead text-label-2">Ends {formatShortDay(localDate(new Date(challenge.ends_at), snapshot.profile.timezone))}</p>
          </section>
        )}
        <Segmented<Metric>
          label="Leaderboard"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "current", label: "Current" },
            { value: "best", label: "Best" },
            { value: "days", label: "Days" },
          ]}
        />
        <p className="text-center text-footnote text-label-2">{METRIC_LINE[metric]}</p>
        {rows === null ? (
          <Skeleton className="h-48 w-full rounded-cell" />
        ) : (
          <ol className="overflow-hidden rounded-cell bg-surface" aria-label="Leaderboard">
            {sorted.map((r, i) => {
              const isPaused = metric === "current" && paused(r);
              return (
                <li key={r.member_id} className={`hairline-b flex min-h-[52px] items-center gap-3 px-4 last:border-b-0 ${r.is_me ? "bg-tide-wash" : ""}`}>
                  <span className="num w-5 text-subhead text-label-2">{i + 1}</span>
                  <Pebble seed={r.avatar_seed} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-body">
                      <span className="truncate">@{r.handle}</span>
                      {r.is_backed && <Lock size={16} className="text-label-2" aria-label="Backed" />}
                    </span>
                    {isPaused && <span className="block text-footnote text-label-3">Paused</span>}
                  </span>
                  <span className={`num text-headline ${isPaused ? "text-label-3" : ""}`}>
                    {metric === "days" ? `${r.days_kept} d` : formatDaysHours(value(r) * 1000)}
                  </span>
                  {!r.is_me && (
                    <>
                      <button type="button" onClick={() => setNudgeTo(r)} aria-label={`Nudge @${r.handle}`} className="pressable flex size-11 items-center justify-center rounded-full text-tide">
                        <HandWaving size={20} aria-hidden />
                      </button>
                      <button type="button" onClick={() => setMenuFor(r)} aria-label={`More for @${r.handle}`} className="pressable -mr-2 flex size-11 items-center justify-center text-label-2">
                        <DotsThree size={22} aria-hidden />
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="flex items-center justify-center gap-1.5 text-footnote text-label-2">
          <ShieldCheck size={14} aria-hidden /> Handles, not names. Your pact sees your number, never the reason it reset.
        </p>
        <Button
          variant="destructive-plain"
          full
          onClick={async () => {
            await leavePact(id).catch(() => undefined);
            router.replace("/app/pact");
          }}
        >
          Leave pact
        </Button>
      </div>

      <Sheet open={nudgeTo !== null} onOpenChange={(v) => !v && setNudgeTo(null)} title={`Nudge @${nudgeTo?.handle ?? ""}`}>
        <InsetGroup>
          {NUDGE_KEYS.map((k) => (
            <Cell
              key={k}
              title={NUDGE_LABELS[k]}
              chevron={false}
              onClick={async () => {
                if (!nudgeTo) return;
                try {
                  await sendNudge(id, nudgeTo.member_id, k);
                  hud("Nudge sent.");
                } catch (e) {
                  hud(e instanceof Error && e.message === "rate_limited" ? "Three nudges a day is the limit. Try tomorrow." : errorMessage(e));
                }
                setNudgeTo(null);
              }}
            />
          ))}
        </InsetGroup>
      </Sheet>

      <Sheet open={menuFor !== null} onOpenChange={(v) => !v && setMenuFor(null)} title={`@${menuFor?.handle ?? ""}`}>
        <InsetGroup>
          <Cell
            title="Mute"
            subtitle="Their nudges stop. They aren't told."
            chevron={false}
            onClick={async () => {
              if (menuFor) await muteMember(menuFor.member_id).catch(() => undefined);
              hud("Muted.");
              setMenuFor(null);
            }}
          />
          <Cell
            title="Report this handle"
            tone="destructive"
            chevron={false}
            onClick={async () => {
              if (menuFor) await reportContent("handle", menuFor.member_id, "offensive_name").catch(() => undefined);
              hud("Report sent. We review within 48 hours.");
              setMenuFor(null);
            }}
          />
        </InsetGroup>
      </Sheet>

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen} title="Invite to your pact">
        {pact?.invite_code ? (
          <>
            <p className="num rounded-card bg-surface py-6 text-center text-[2rem] tracking-[0.2em]">{pact.invite_code}</p>
            <Button full className="mt-4" icon={<ShareNetwork size={20} aria-hidden />} onClick={() => share(inviteUrl(pact.invite_code as string), hud)}>
              Share invite link
            </Button>
            <p className="mt-3 text-center text-footnote text-label-2">Invites open the app straight to this pact.</p>
          </>
        ) : (
          <p className="text-body text-label-2">Ask the person who started this pact for the invite link.</p>
        )}
      </Sheet>
    </main>
  );
}

/** P7: the opt-in global board. */
export function GlobalBoardScreen() {
  return <Gate>{(s) => (cloudEnabled && s.mode === "cloud" ? <GlobalBoard snapshot={s} /> : <PactHome snapshot={s} />)}</Gate>;
}

function GlobalBoard({ snapshot }: { snapshot: Snapshot }) {
  const [metric, setMetric] = useState<Metric>("current");
  const [rows, setRows] = useState<{ metric: Metric; data: SeasonRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    seasonBoard(CURRENT_SEASON.id, metric)
      .then((data) => setRows({ metric, data }))
      .catch((e) => setError(errorMessage(e)));
  }, [metric]);
  const shown = rows?.metric === metric ? rows.data : null;
  const optedIn = snapshot.profile.leaderboardVisibility === "global";
  return (
    <main>
      <LargeTitle title="Global board" />
      <div className="space-y-4 px-4">
        <p className="text-subhead text-label-2">Only people who choose Everyone appear here, by handle. Top 100 plus your own rank.</p>
        <Segmented<Metric>
          label="Global board"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "current", label: "Current" },
            { value: "best", label: "Best" },
            { value: "days", label: "Days" },
          ]}
        />
        <p className="text-center text-footnote text-label-2">{METRIC_LINE[metric]}</p>
        {error && <p className="rounded-cell bg-tertiary p-3 text-subhead">{error}</p>}
        {!shown && !error ? (
          <Skeleton className="h-48 w-full rounded-cell" />
        ) : shown && shown.length === 0 ? (
          <p className="rounded-cell bg-surface p-5 text-center text-body text-label-2">Nobody has joined the global board yet.</p>
        ) : (
          <ol className="overflow-hidden rounded-cell bg-surface" aria-label="Global board">
            {(shown ?? []).map((r) => (
              <li key={r.handle} className={`hairline-b flex min-h-[52px] items-center gap-3 px-4 last:border-b-0 ${r.is_me ? "bg-tide-wash" : ""}`}>
                <span className="num w-7 text-subhead text-label-2">{r.rank}</span>
                <Pebble seed={r.avatar_seed} size={32} />
                <span className="min-w-0 flex-1 truncate text-body">@{r.handle}</span>
                <span className="num text-headline">{metric === "days" ? `${r.value} d` : formatDaysHours(r.value * 1000)}</span>
              </li>
            ))}
          </ol>
        )}
        {!optedIn && (
          <Link href="/app/settings" className="pressable inline-flex min-h-11 items-center text-headline text-tide">
            Choose who sees your streak
          </Link>
        )}
      </div>
    </main>
  );
}

/** /app/join/[code]: works before sign-in (the code is stashed and joined after onboarding). */
export function JoinScreen({ code }: { code: string }) {
  const router = useRouter();
  const { status } = useWillWar();
  useEffect(() => {
    if (status === "loading") return;
    if (status === "ready" && cloudEnabled) {
      joinPact(code)
        .then((id) => router.replace(`/app/pact/${id}`))
        .catch(() => router.replace("/app/pact"));
      return;
    }
    try {
      localStorage.setItem("ww-pending-join", code);
    } catch {
      // ignore
    }
    router.replace(status === "ready" ? "/app/pact" : "/app/start");
  }, [status, code, router]);
  return <p className="px-4 pt-24 text-center text-body text-label-2">Opening your invite…</p>;
}
