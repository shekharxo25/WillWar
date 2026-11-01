"use client";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button } from "@/components/ui/Button";
import { Cell, CellGroup, Toggle } from "@/components/ui/Cell";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Paywall } from "@/components/pro/Paywall";
import { SEASON } from "@/lib/config/season";
import { FREE_CAMP_MAX, PRO_CAMP_MAX } from "@/lib/config/plans";
import { addDays, localDate, zonedMidnight } from "@/lib/time";
import { NUDGES, StoreError, type Camp, type ChallengeKind, type NudgeKey } from "@/lib/store/types";
import { CAMP_ERRORS, inviteLink, type RankedRow } from "./board";
import { campAction, REPORT_REASONS } from "./actions";

const errText = (e: unknown) => CAMP_ERRORS[(e as StoreError).code] ?? "That didn't work. Try again.";

/** C2 */
export function StartCampSheet({ open, onOpenChange, needsPro, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; needsPro: boolean; onCreated: (id: string) => void }) {
  const { store, toast, snap } = useApp();
  const tz = snap?.profile.timezone ?? "Asia/Kolkata";
  const inSeason = typeof window !== "undefined" && localDate(new Date(), tz) <= SEASON.endsOn;
  const [name, setName] = useState("");
  const [linked, setLinked] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const id = await store.createCamp(name.trim(), inSeason && linked ? SEASON.id : null);
      toast("Camp started.");
      setName("");
      onCreated(id);
    } catch (e) {
      if ((e as StoreError).code === "pro_required") setPaywall(true);
      else setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  if (needsPro || paywall) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="ANOTHER CAMP?" description="Free accounts run one camp. Pro runs as many as you like, up to 50 people each." detent="large">
        <Paywall source="feature" onContinueFree={() => onOpenChange(false)} onPro={() => setPaywall(false)} />
      </Sheet>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="START A CAMP">
      <label className="mb-2 block text-[13px] leading-[18px] text-text-2" htmlFor="camp-name">Camp name</label>
      <Input id="camp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Night shift" autoComplete="off" error={error} />
      {inSeason && (
        <div className="mt-4">
          <CellGroup>
            <Cell title={`Link to ${SEASON.name}`} chevron={false} accessory={<Toggle checked={linked} onChange={setLinked} label={`Link to ${SEASON.name}`} />} />
          </CellGroup>
        </div>
      )}
      <p className="mt-3 text-[13px] leading-[18px] text-text-2">Free camps hold up to {FREE_CAMP_MAX}. Pro holds up to {PRO_CAMP_MAX}.</p>
      <div className="mt-5">
        <Button disabled={busy || name.trim().length < 2} onClick={submit}>Start camp</Button>
      </div>
    </Sheet>
  );
}

/** Join with a code */
export function JoinSheet({ open, onOpenChange, onJoined }: { open: boolean; onOpenChange: (o: boolean) => void; onJoined: (id: string) => void }) {
  const { store, toast } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const id = await store.joinCamp(code.trim().toLowerCase());
      toast("You're in the camp.");
      onJoined(id);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="JOIN WITH A CODE" description="Your friend can find the code on their camp's invite screen.">
      <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))} placeholder="Invite code" autoCapitalize="none" autoComplete="off" spellCheck={false} maxLength={20} aria-label="Invite code" error={error} />
      <div className="mt-5">
        <Button disabled={busy || code.trim().length < 4} onClick={submit}>Join camp</Button>
      </div>
    </Sheet>
  );
}

/** C3 */
export function InviteSheet({ open, onOpenChange, camp }: { open: boolean; onOpenChange: (o: boolean) => void; camp: Camp }) {
  const { toast } = useApp();
  const link = typeof window !== "undefined" ? inviteLink(window.location.origin, camp.inviteCode) : "";
  async function share() {
    const data = { title: "WillWar", text: `Join my camp on WillWar. Code: ${camp.inviteCode}`, url: link };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied.");
    } catch {
      toast("Copy the link below.");
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="INVITE TO CAMP">
      <p className="text-[13px] leading-[18px] text-text-2">Invite code</p>
      <p className="display mt-1 text-[48px] leading-[48px] tracking-[0.04em]">{camp.inviteCode}</p>
      <p className="mt-4 break-all rounded-button bg-bg px-4 py-3 text-[15px] leading-5 text-text-2 select-all">{link}</p>
      <p className="mt-3 text-[13px] leading-[18px] text-text-2">Invites open the app straight to this camp.</p>
      <div className="mt-5">
        <Button onClick={share}>Share invite link</Button>
      </div>
    </Sheet>
  );
}

/** C5 plus member actions (mute, report, owner removes). */
export function MemberSheet({ open, onOpenChange, camp, member, isOwner, onChanged }: { open: boolean; onOpenChange: (o: boolean) => void; camp: Camp; member: RankedRow | null; isOwner: boolean; onChanged: () => void }) {
  const { store, toast } = useApp();
  const [sel, setSel] = useState<NudgeKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"nudge" | "report">("nudge");
  if (!member) return null;

  async function send() {
    if (!sel || !member) return;
    setError(null);
    try {
      await store.sendNudge(camp.id, member.memberId, sel);
      toast("Nudge sent.");
      setSel(null);
      onOpenChange(false);
    } catch (e) {
      setError(errText(e));
    }
  }
  async function act(fn: "mute_member" | "remove_member", ok: string) {
    const r = await campAction(fn, { p_camp: camp.id, p_user: member!.memberId });
    if (r.error) return toast("That didn't work. Try again.");
    toast(ok);
    onOpenChange(false);
    onChanged();
  }
  async function report(reason: string) {
    const r = await campAction("report_member", { p_camp: camp.id, p_user: member!.memberId, p_reason: reason });
    if (r.error) return toast("That didn't work. Try again.");
    toast("Reported. Thanks for telling us.");
    setView("nudge");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setView("nudge"); setError(null); } }} title={view === "report" ? "REPORT" : `NUDGE ${member.handle}`} detent="large">
      {view === "nudge" ? (
        <>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Nudge">
            {NUDGES.map((n) => (
              <button
                key={n.key}
                type="button"
                role="radio"
                aria-checked={sel === n.key}
                onClick={() => setSel(n.key)}
                className={`press min-h-[52px] rounded-button px-4 text-left text-[17px] leading-[22px] ${sel === n.key ? "bg-primary font-semibold text-on-primary" : "bg-bg"}`}
              >
                {n.label}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-[13px] leading-[18px] text-destructive" role="alert">{error}</p>}
          <div className="mt-5">
            <Button disabled={!sel} onClick={send}>Send nudge</Button>
          </div>
          <div className="mt-6">
            <CellGroup>
              <Cell title={`Mute ${member.handle}`} subtitle="You won't get their nudges." onClick={() => act("mute_member", "Muted.")} chevron={false} />
              <Cell title={`Report ${member.handle}`} onClick={() => setView("report")} />
              {isOwner && <Cell title="Remove from camp" onClick={() => act("remove_member", "Removed from camp.")} chevron={false} />}
            </CellGroup>
          </div>
        </>
      ) : (
        <>
          <p className="text-[15px] leading-5 text-text-2">What&apos;s wrong with {member.handle}? We review every report.</p>
          <div className="mt-4">
            <CellGroup>
              {REPORT_REASONS.map((r) => (
                <Cell key={r.key} title={r.label} onClick={() => report(r.key)} />
              ))}
            </CellGroup>
          </div>
          <Button variant="plain" className="mt-3" onClick={() => setView("nudge")}>Back</Button>
        </>
      )}
    </Sheet>
  );
}

/** C6 (Pro) */
export function ChallengeSheet({ open, onOpenChange, campId, pro, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; campId: string; pro: boolean; onCreated: () => void }) {
  const { store, toast, snap } = useApp();
  const tz = snap?.profile.timezone ?? "Asia/Kolkata";
  const today = typeof window !== "undefined" ? localDate(new Date(), tz) : "";
  const [kind, setKind] = useState<ChallengeKind | null>(null);
  const [target, setTarget] = useState(14);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today ? addDays(today, 20) : "");
  const [error, setError] = useState<string | null>(null);

  if (!pro) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="CAMP CHALLENGES" description="Challenges are part of Pro." detent="large">
        <Paywall source="feature" onContinueFree={() => onOpenChange(false)} />
      </Sheet>
    );
  }
  async function submit() {
    if (!kind) return;
    setError(null);
    try {
      await store.createChallenge(campId, kind, kind === "first_to_days" ? target : null, zonedMidnight(start, tz).toISOString(), zonedMidnight(addDays(end, 1), tz).toISOString());
      toast("Challenge started.");
      onCreated();
      onOpenChange(false);
    } catch (e) {
      setError(errText(e));
    }
  }
  const kinds: { k: ChallengeKind; label: string }[] = [
    { k: "first_to_days", label: "First to X days" },
    { k: "longest_streak", label: "Longest streak" },
    { k: "most_days", label: "Most days kept" },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="NEW CHALLENGE" detent="large">
      <div className="flex flex-wrap gap-2">
        {kinds.map((x) => (
          <Chip key={x.k} selected={kind === x.k} onClick={() => setKind(x.k)}>{x.label}</Chip>
        ))}
      </div>
      {kind === "first_to_days" && (
        <div className="mt-4">
          <label htmlFor="target" className="mb-2 block text-[13px] leading-[18px] text-text-2">Target days</label>
          <Input id="target" type="number" inputMode="numeric" min={1} max={365} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cstart" className="mb-2 block text-[13px] leading-[18px] text-text-2">Starts</label>
          <Input id="cstart" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cend" className="mb-2 block text-[13px] leading-[18px] text-text-2">Ends</label>
          <Input id="cend" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-2 text-[13px] leading-[18px] text-destructive" role="alert">{error}</p>}
      <div className="mt-5">
        <Button disabled={!kind} onClick={submit}>Start challenge</Button>
      </div>
    </Sheet>
  );
}

/** Camp menu: invite, regenerate code (owner), leave. */
export function CampMenuSheet({ open, onOpenChange, camp, isOwner, onInvite, onLeft, onChanged }: { open: boolean; onOpenChange: (o: boolean) => void; camp: Camp; isOwner: boolean; onInvite: () => void; onLeft: () => void; onChanged: () => void }) {
  const { store, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  async function regen() {
    const r = await campAction("regenerate_invite_code", { p_camp: camp.id });
    if (r.device) return toast("New codes need a cloud account.");
    if (r.error) return toast("That didn't work. Try again.");
    toast("New invite code made. The old one stops working.");
    onChanged();
  }
  async function leave() {
    try {
      await store.leaveCamp(camp.id);
      toast("You left the camp.");
      onLeft();
    } catch {
      toast("That didn't work. Try again.");
    }
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setConfirm(false); }} title={camp.name.toUpperCase()}>
      {!confirm ? (
        <CellGroup>
          <Cell title="Invite friends" onClick={onInvite} />
          {isOwner && <Cell title="Make a new invite code" onClick={regen} chevron={false} />}
          <Cell title="Leave camp" onClick={() => setConfirm(true)} chevron={false} />
        </CellGroup>
      ) : (
        <>
          <p className="text-[17px] leading-[22px]">Leave {camp.name}? Your streak stays yours. You can rejoin with a code.</p>
          <div className="mt-5 space-y-3">
            <Button variant="secondary" onClick={leave}>Leave camp</Button>
            <Button variant="plain" className="w-full" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
