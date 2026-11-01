"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Cell, CellGroup, Toggle } from "@/components/ui/Cell";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Wheel, WheelColumn } from "@/components/ui/WheelPicker";
import { TONE_SAMPLES } from "@/components/onboarding/Onboarding";
import { SEASON } from "@/lib/config/season";
import { formatMoney } from "@/lib/config/causes";
import { addDays, localDate, shortDate } from "@/lib/time";
import { isPro } from "@/lib/store/engine";
import { loadReminderPrefs, pushAvailable, saveReminderPrefs, subscribePush, type ReminderPrefs } from "@/lib/reminders";
import type { Tone, Visibility } from "@/lib/store/types";

export function Settings() {
  const { snap, store, refresh, toast } = useApp();
  const router = useRouter();
  const [prefs, setPrefs] = useState<ReminderPrefs>({ time: "21:30", nightWatch: false, bell: false });
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const [sheet, setSheet] = useState<null | "time" | "tone" | "delete" | "end" | "new">(null);
  const [push, setPush] = useState<{ ok: boolean; reason?: string }>({ ok: false });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(loadReminderPrefs());
    setPush(pushAvailable());
    try {
      const t = localStorage.getItem("ww.theme");
      setTheme(t === "dark" || t === "light" ? t : "system");
    } catch {}
  }, []);
  if (!snap) return <Screen title="SETTINGS" back="/app/me"><div className="skeleton h-40 w-full" /></Screen>;
  const pro = isPro(snap.entitlement, new Date());
  const p = snap.profile;
  const upd = async (x: Parameters<typeof store.updatePreferences>[0]) => {
    try {
      await store.updatePreferences(x);
      await refresh();
    } catch {
      toast("Couldn't save. Try again.");
    }
  };
  const setP = (x: Partial<ReminderPrefs>) => {
    saveReminderPrefs(x);
    setPrefs((o) => ({ ...o, ...x }));
  };
  const applyTheme = (t: "system" | "dark" | "light") => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("ww.theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("ww.theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {}
  };
  const exportData = async () => {
    const data = await store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `willwar-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const goal = snap.goal;
  const goalOver = !goal || !!goal.closedAt || goal.endsOn < localDate(new Date(), p.timezone);

  return (
    <Screen title="SETTINGS" back="/app/me">
      <CellGroup header="Account">
        <Cell title="Handle" value={p.handle} />
        <Cell title="Account" value={store.mode === "device" ? "This phone" : "Email"} />
        <Cell title="Corner talk tone" value={p.tone[0].toUpperCase() + p.tone.slice(1)} onClick={() => setSheet("tone")} />
      </CellGroup>

      <div id="challenge" />
      <CellGroup header="Challenge" footer={goal && !goalOver ? `Ends ${shortDate(goal.endsOn)}.` : undefined}>
        {goal && !goalOver && !goal.seasonId && <Cell title="Change end date" onClick={() => setSheet("end")} />}
        {goalOver && <Cell title="Start a new challenge" onClick={() => setSheet("new")} />}
        {goal && !goalOver && goal.seasonId && <Cell title={SEASON.name} subtitle="Season challenges end on 30 November." />}
      </CellGroup>

      <CellGroup header="Notifications" footer={push.ok ? undefined : push.reason}>
        <Cell title="Reminder time" value={prefs.time} onClick={() => setSheet("time")} />
        <Cell title="Discreet notifications" subtitle="WillWar: Day 12. Tap to check in." accessory={<Toggle checked={p.discreetNotifications} onChange={(v) => upd({ discreetNotifications: v })} label="Discreet notifications" />} chevron={false} />
        <Cell title="Night watch" subtitle="A check-in at 23:00, inside quiet hours" accessory={<Toggle checked={prefs.nightWatch} onChange={(v) => setP({ nightWatch: v })} label="Night watch" />} chevron={false} />
        <Cell title="Round bell" subtitle="Plays at the end of a round" accessory={<Toggle checked={prefs.bell} onChange={(v) => setP({ bell: v })} label="Round bell" />} chevron={false} />
        {push.ok && <Cell title="Turn on reminders" onClick={async () => { const r = await subscribePush(); toast(r === "subscribed" ? "Reminders on." : r === "denied" ? "Reminders are blocked in your settings." : "Reminders aren't available here."); }} />}
      </CellGroup>

      <div id="privacy" />
      <CellGroup header="Privacy">
        <div className="px-4 py-3">
          <div className="mb-2 text-[15px] leading-5">Who sees your streak</div>
          <Segmented<Visibility>
            label="Who sees your streak"
            value={p.leaderboardVisibility}
            onChange={(v) => upd({ leaderboardVisibility: v })}
            options={[{ value: "private", label: "Only me" }, { value: "camps", label: "My camps" }, { value: "global", label: "Everyone" }]}
          />
        </div>
        <Cell title="Show a Backed badge" accessory={<Toggle checked={p.showBackedBadge} onChange={(v) => upd({ showBackedBadge: v })} label="Show a Backed badge" />} chevron={false} />
        <Cell title="Export my data" onClick={exportData} />
        <Cell title="Delete my account" onClick={() => setSheet("delete")} />
      </CellGroup>

      <CellGroup header="Appearance" footer={pro ? undefined : "Clock skins come with Pro."}>
        <div className="px-4 py-3">
          <Segmented label="Appearance" value={theme} onChange={applyTheme} options={[{ value: "system", label: "System" }, { value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
        </div>
        <Cell title="Clock skins" value={pro ? "Gym (default)" : "Pro"} href={pro ? undefined : "/app/pro"} />
      </CellGroup>

      <CellGroup header="Subscription">
        <Cell title={pro ? `Pro, ${snap.entitlement?.plan === "annual" ? "Annual" : "Season pass"}` : "Free"} subtitle={pro && snap.entitlement?.currentPeriodEnd ? `Active until ${shortDate(snap.entitlement.currentPeriodEnd.slice(0, 10))}` : undefined} href={pro ? undefined : "/app/pro"} />
        {pro && <Cell title="Cancel anytime" subtitle="Annual plans can be cancelled from the receipt email or by contacting support." />}
      </CellGroup>

      <CellGroup header="Support and safety">
        <Cell title="Get support and crisis lines" href="/support" />
      </CellGroup>
      <CellGroup header="Legal">
        <Cell title="Privacy" href="/privacy" />
        <Cell title="Terms" href="/terms" />
        <Cell title="Health disclaimer" href="/health" />
      </CellGroup>
      <p className="mt-6 px-4 text-[13px] leading-[18px] text-text-3">18+ only. Not medical advice.</p>

      <Sheet open={sheet === "tone"} onOpenChange={(o) => setSheet(o ? "tone" : null)} title="CORNER TALK TONE">
        <div className="space-y-2">
          {(Object.keys(TONE_SAMPLES) as Tone[]).map((t) => (
            <button key={t} type="button" onClick={() => { void upd({ tone: t }); setSheet(null); }} className={`press block w-full rounded-card bg-bg p-4 text-left ${p.tone === t ? "shadow-[inset_0_0_0_2px_var(--text)]" : ""}`}>
              <span className="block font-semibold">{t[0].toUpperCase() + t.slice(1)}</span>
              <span className="mt-1 block text-[15px] leading-5 text-text-2">{TONE_SAMPLES[t]}</span>
            </button>
          ))}
        </div>
      </Sheet>
      <TimeSheet open={sheet === "time"} onOpenChange={(o) => setSheet(o ? "time" : null)} value={prefs.time} onSave={(time) => { setP({ time }); setSheet(null); }} />
      <EndDateSheet open={sheet === "end" || sheet === "new"} isNew={sheet === "new"} onOpenChange={(o) => !o && setSheet(null)} />
      <DeleteSheet open={sheet === "delete"} onOpenChange={(o) => setSheet(o ? "delete" : null)} onDeleted={() => { toast("Account deleted."); router.replace("/"); }} warChest={snap.warChest?.status === "active" ? formatMoney(snap.warChest.amountMinor - snap.warChest.forfeitedMinor, snap.warChest.currency) : null} />
    </Screen>
  );
}

function TimeSheet({ open, onOpenChange, value, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; value: string; onSave: (v: string) => void }) {
  const [h, setH] = useState(Number(value.slice(0, 2)));
  const [m, setM] = useState(Number(value.slice(3, 5)));
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="REMINDER TIME">
      <Wheel>
        <WheelColumn label="Hour" items={Array.from({ length: 24 }, (_, i) => i)} value={h} onChange={setH} format={(v) => String(v).padStart(2, "0")} />
        <WheelColumn label="Minute" items={[0, 15, 30, 45]} value={m} onChange={setM} format={(v) => String(v).padStart(2, "0")} />
      </Wheel>
      <Button className="mt-6" onClick={() => onSave(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)}>Save</Button>
    </Sheet>
  );
}

function EndDateSheet({ open, isNew, onOpenChange }: { open: boolean; isNew: boolean; onOpenChange: (o: boolean) => void }) {
  const { snap, store, refresh, toast } = useApp();
  const [date, setDate] = useState("");
  if (!snap) return null;
  const today = localDate(new Date(), snap.profile.timezone);
  const seasonOpen = today <= SEASON.endsOn;
  const start = async (endsOn: string | null, season: string | null) => {
    try {
      await store.startGoal(endsOn, season);
      await refresh();
      toast("Your clock is running.");
      onOpenChange(false);
    } catch {
      toast("Pick an end date between tomorrow and a year from today.");
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={isNew ? "START A NEW CHALLENGE" : "CHANGE END DATE"} description={isNew ? "Your record stays. A new window starts today." : "Pick a new last day."}>
      {isNew && <Button className="mb-3" onClick={() => start(addDays(today, 29), null)}>30 days from today</Button>}
      {isNew && seasonOpen && <Button variant="secondary" className="mb-3" onClick={() => start(null, SEASON.id)}>{SEASON.name}</Button>}
      <Input type="date" min={addDays(today, 1)} max={addDays(today, 365)} value={date} onChange={(e) => setDate(e.target.value)} />
      <Button
        className="mt-3"
        variant={isNew ? "secondary" : "primary"}
        disabled={!date}
        onClick={async () => {
          if (isNew) return start(date, null);
          try {
            await store.changeEndDate(date);
          } catch {
            toast("Pick an end date between tomorrow and a year from today.");
            return;
          }
          await refresh();
          onOpenChange(false);
        }}
      >
        {isNew ? "Set my own end date" : "Save"}
      </Button>
    </Sheet>
  );
}

function DeleteSheet({ open, onOpenChange, onDeleted, warChest }: { open: boolean; onOpenChange: (o: boolean) => void; onDeleted: () => void; warChest: string | null }) {
  const { store } = useApp();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="DELETE YOUR ACCOUNT?" detent="large">
      <div className="space-y-3 text-[15px] leading-5 text-text-2">
        <p>This deletes your handle, streaks, check-ins, rounds, camps you own and your settings right away. Payment records the law requires us to keep are kept without your name.</p>
        {warChest && <p>Your War Chest ({warChest} still yours) is returned before anything is deleted.</p>}
        <p>Type &quot;delete&quot; to confirm.</p>
      </div>
      <div className="mt-4">
        <Input value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="none" placeholder="delete" error={err} />
      </div>
      <Button
        variant="destructive"
        className="mt-5"
        disabled={text.trim().toLowerCase() !== "delete" || busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await store.deleteAccount();
            onDeleted();
          } catch (e) {
            setErr(e instanceof Error && e.message === "refund_first" ? "We're returning your War Chest first. Try again in a few minutes." : "Couldn't delete right now. Try again, or contact support.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Delete my account
      </Button>
    </Sheet>
  );
}
