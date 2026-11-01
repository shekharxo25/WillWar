"use client";

import { ArrowLeft, Lifebuoy } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gate } from "@/components/app/Gate";
import { isStandalone } from "@/components/app/ServiceWorker";
import { Button } from "@/components/ui/Button";
import { Segmented, Switch } from "@/components/ui/Controls";
import { Cell, InsetGroup } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { useHud } from "@/components/ui/Hud";
import { countryFromTimezone, crisisResourcesFor } from "@/lib/config/crisis-resources";
import { CURRENT_SEASON, type LeaderboardVisibility, TONE_LABELS, TONES, type Tone } from "@/lib/domain/constants";
import type { Snapshot } from "@/lib/domain/types";
import { enableReminders, pushSupport, type PushSupport } from "@/lib/push";
import { useWillWar } from "@/lib/store/provider";
import { useAction } from "@/lib/store/use-action";
import { deviceTimeZone, formatLongDay } from "@/lib/time";

type Theme = "system" | "light" | "dark";
type Water = "harbor" | "dawn" | "glacier";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function SettingsScreen() {
  return <Gate>{(s) => <Settings snapshot={s} />}</Gate>;
}

function Settings({ snapshot }: { snapshot: Snapshot }) {
  const router = useRouter();
  const { store, isPro } = useWillWar();
  const { run } = useAction();
  const hud = useHud();
  const p = snapshot.profile;
  // Settings renders only on the client (behind Gate), so lazy state can read storage.
  const [theme, setTheme] = useState<Theme>(() => {
    const t = readRaw("ww-theme");
    return t === "light" || t === "dark" ? t : "system";
  });
  const [water, setWater] = useState<Water>(() => {
    const w = readRaw("ww-water");
    return w === "dawn" || w === "glacier" ? w : "harbor";
  });
  const [reminder, setReminder] = useState({ time: p.reminderTime, nightWatch: p.nightWatch });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const deviceTz = deviceTimeZone();

  const applyTheme = (t: Theme) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("ww-theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("ww-theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {
      // ignore
    }
  };

  const applyWater = (w: Water) => {
    if (w !== "harbor" && !isPro) return router.push("/app/pro");
    setWater(w);
    try {
      if (w === "harbor") {
        localStorage.removeItem("ww-water");
        delete document.documentElement.dataset.water;
      } else {
        localStorage.setItem("ww-water", w);
        document.documentElement.dataset.water = w;
      }
    } catch {
      // ignore
    }
  };

  // Reminders are sent by the server, so the time and Night watch live on the profile.
  const saveReminder = (next: typeof reminder) => {
    setReminder(next);
    void run(() => store.updatePreferences({ reminderTime: next.time, nightWatch: next.nightWatch }), { quiet: true });
  };
  const [pushState, setPushState] = useState<PushSupport | "on">(() => pushSupport(isStandalone()));
  const turnOnReminders = async () => {
    const ok = await enableReminders().catch(() => false);
    setPushState(ok ? "on" : pushSupport(isStandalone()));
    hud(ok ? "Reminders on." : "Reminders weren't switched on. Check this app's notification permission.");
  };

  const exportData = async () => {
    const blob = await run(() => store.exportData());
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `willwar-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    hud("Export ready.");
  };

  return (
    <main className="pb-8">
      <header className="flex items-center gap-1 px-2 pt-[calc(env(safe-area-inset-top)+8px)]">
        <Link href="/app/me" className="pressable flex min-h-11 items-center gap-1 px-2 text-body text-tide">
          <ArrowLeft size={18} aria-hidden /> Me
        </Link>
      </header>
      <h1 className="px-4 pt-1 pb-3 text-large-title font-bold">Settings</h1>

      <div className="space-y-6 px-4">
        <InsetGroup header="Account">
          <Cell title="Handle" value={`@${p.handle}`} chevron={false} />
          {snapshot.mode === "cloud" ? (
            <>
              <Cell title="Email" value={snapshot.email ?? ""} chevron={false} />
              <Cell
                title="Sign out"
                tone="tide"
                chevron={false}
                onClick={async () => {
                  await store.signOut();
                  router.replace("/");
                }}
              />
            </>
          ) : (
            <Cell title="Saved on this device" subtitle="Nothing leaves your phone" chevron={false} />
          )}
        </InsetGroup>

        <InsetGroup header="Challenge">
          <Cell
            title="Current challenge"
            value={snapshot.goal ? (snapshot.goal.seasonId === CURRENT_SEASON.id ? CURRENT_SEASON.name : "Custom") : "None"}
            chevron={false}
          />
          {snapshot.goal && <Cell title="Ends" value={formatLongDay(snapshot.goal.endsOn)} chevron={false} />}
        </InsetGroup>

        <InsetGroup header="Morning line">
          <div className="p-3">
            <Segmented<Tone>
              label="Tone"
              value={p.tone}
              onChange={(t) => run(() => store.updatePreferences({ tone: t }), { success: "Tone saved." })}
              options={TONES.map((t) => ({ value: t, label: TONE_LABELS[t] }))}
            />
          </div>
        </InsetGroup>

        <InsetGroup
          header="Notifications"
          footer={
            pushState === "needs-account"
              ? "Reminders need an online account, which this build doesn't have."
              : pushState === "needs-install"
                ? "On iPhone, reminders work once WillWar is on your Home Screen."
                : pushState === "denied"
                  ? "Notifications are blocked for WillWar in your browser settings."
                  : "Quiet from 23:00 to 07:00. Lock screens never mention the challenge."
          }
        >
          {pushState === "ok" && <Cell title="Turn on reminders" tone="tide" onClick={turnOnReminders} />}
          <Cell
            title="Daily reminder"
            chevron={false}
            trailing={
              <input
                type="time"
                aria-label="Daily reminder time"
                value={reminder.time}
                onChange={(e) => saveReminder({ ...reminder, time: e.target.value })}
                className="num rounded-md bg-tertiary px-2 py-1 text-body"
              />
            }
          />
          <Cell
            title="Discreet notifications"
            subtitle="WillWar · Day 12. Tap to check in."
            chevron={false}
            trailing={
              <Switch
                label="Discreet notifications"
                checked={p.discreetNotifications}
                onCheckedChange={(v) => run(() => store.updatePreferences({ discreetNotifications: v }))}
              />
            }
          />
          <Cell
            title="Night watch"
            subtitle="A gentle check-in at 23:00"
            chevron={false}
            trailing={<Switch label="Night watch" checked={reminder.nightWatch} onCheckedChange={(v) => saveReminder({ ...reminder, nightWatch: v })} />}
          />
        </InsetGroup>

        <InsetGroup header="Privacy" footer="Nobody ever sees your reset reasons, times or notes.">
          <div className="hairline-b p-3">
            <p className="mb-2 px-1 text-subhead text-label-2">Who sees your streak</p>
            <Segmented<LeaderboardVisibility>
              label="Who sees your streak"
              value={p.leaderboardVisibility}
              onChange={(v) => run(() => store.updatePreferences({ leaderboardVisibility: v }), { success: "Saved." })}
              options={[
                { value: "private", label: "Only me" },
                { value: "pacts", label: "My pacts" },
                { value: "global", label: "Everyone" },
              ]}
            />
          </div>
          <Cell
            title="Show a Backed badge"
            subtitle="Pacts see that you have a War Chest, never the amount"
            chevron={false}
            trailing={
              <Switch label="Show a Backed badge" checked={p.showBackedBadge} onCheckedChange={(v) => run(() => store.updatePreferences({ showBackedBadge: v }))} />
            }
          />
          <Cell title="Export my data" onClick={exportData} />
          <Cell title="Delete my account" tone="destructive" onClick={() => setDeleteOpen(true)} />
        </InsetGroup>

        <InsetGroup header="Time zone" footer="Your day is decided by this time zone. You can change it once a week.">
          <Cell title={p.timezone} chevron={false} />
          {deviceTz !== p.timezone && (
            <Cell title={`Use this phone's time zone (${deviceTz})`} tone="tide" onClick={() => run(() => store.setTimezone(deviceTz), { success: "Time zone saved." })} />
          )}
        </InsetGroup>

        <InsetGroup header="Appearance">
          <div className="hairline-b p-3">
            <Segmented<Theme>
              label="Appearance"
              value={theme}
              onChange={applyTheme}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
          <div className="p-3">
            <p className="mb-2 px-1 text-subhead text-label-2">Tide theme{isPro ? "" : " (Pro)"}</p>
            <Segmented<Water>
              label="Tide theme"
              value={water}
              onChange={applyWater}
              options={[
                { value: "harbor", label: "Harbor" },
                { value: "dawn", label: "Dawn" },
                { value: "glacier", label: "Glacier" },
              ]}
            />
          </div>
        </InsetGroup>

        <InsetGroup header="Subscription">
          <Cell title={isPro ? "You're on Pro" : "WillWar Free"} subtitle={isPro ? "Cancel anytime from your payment provider" : "See what Pro adds"} href="/app/pro" />
        </InsetGroup>

        <InsetGroup header="Support and safety">
          <Cell icon={<Lifebuoy size={18} aria-hidden />} title="Get support now" onClick={() => setSupportOpen(true)} />
          <Cell title="Report a problem" href="mailto:[support email]" external />
        </InsetGroup>

        <InsetGroup header="Legal">
          <Cell title="Privacy" href="/privacy" external />
          <Cell title="Terms" href="/terms" external />
          <Cell title="Health and safety" href="/health" external />
        </InsetGroup>
      </div>

      <DeleteSheet open={deleteOpen} onOpenChange={setDeleteOpen} mode={snapshot.mode} />
      <Sheet open={supportOpen} onOpenChange={setSupportOpen} title="Get support now" description="Free, confidential, and there for anything, not just this.">
        <InsetGroup>
          {crisisResourcesFor(countryFromTimezone(p.timezone)).map((r) => (
            <Cell key={r.id} title={r.name} subtitle={r.detail} href={r.href} external value={<span className="text-tide">{r.linkLabel}</span>} chevron={false} />
          ))}
        </InsetGroup>
      </Sheet>
    </main>
  );
}

function DeleteSheet({ open, onOpenChange, mode }: { open: boolean; onOpenChange: (v: boolean) => void; mode: "device" | "cloud" }) {
  const router = useRouter();
  const { store, refresh } = useWillWar();
  const { run, busy, error } = useAction();
  const [typed, setTyped] = useState("");
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Delete your account?"
      description={
        mode === "device"
          ? "This deletes your streaks, check-ins, games and settings from this device. It can't be undone."
          : "We return any War Chest money first, then delete your account and everything linked to it. Backups age out within 30 days. It can't be undone."
      }
    >
      <label className="block">
        <span className="text-footnote text-label-2">Type delete to confirm</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoCapitalize="none"
          className="mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-body ring-[0.5px] ring-separator"
        />
      </label>
      {error && <p className="mt-2 text-footnote text-destructive">{error}</p>}
      <div className="mt-6 grid gap-2">
        <Button
          variant="destructive"
          full
          busy={busy}
          disabled={typed.trim().toLowerCase() !== "delete"}
          onClick={async () => {
            const ok = await run(() => store.deleteAccount().then(() => true), { quiet: true });
            if (ok) {
              await refresh();
              router.replace("/");
            }
          }}
        >
          Delete my account
        </Button>
        <Button variant="plain" full onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
