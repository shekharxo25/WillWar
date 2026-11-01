"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Cell";
import { Wheel, WheelColumn } from "@/components/ui/WheelPicker";
import { useApp } from "@/components/AppProvider";
import { saveReminderPrefs, subscribePush } from "@/lib/reminders";

/** Onboarding step 9 (installed app only). Push permission is asked only from this tap. */
export function Reminders({ onDone }: { onDone: () => void }) {
  const { store, toast } = useApp();
  const [h, setH] = useState(21);
  const [m, setM] = useState(30);
  const [discreet, setDiscreet] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const allow = async () => {
    saveReminderPrefs({ time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
    await store.updatePreferences({ discreetNotifications: discreet }).catch(() => undefined);
    const r = await subscribePush();
    if (r === "subscribed") toast("Reminders on.");
    else if (r === "disabled") {
      setNote("Reminders switch on when push is configured for this server. Your time is saved.");
      setTimeout(onDone, 1800);
      return;
    }
    onDone();
  };
  return (
    <section className="flex flex-1 flex-col">
      <h1 className="display text-[40px] leading-[40px]">A NUDGE EACH DAY.</h1>
      <div className="mt-6">
        <Wheel>
          <WheelColumn label="Hour" items={Array.from({ length: 24 }, (_, i) => i)} value={h} onChange={setH} format={(v) => String(v).padStart(2, "0")} />
          <WheelColumn label="Minute" items={[0, 15, 30, 45]} value={m} onChange={setM} format={(v) => String(v).padStart(2, "0")} />
        </Wheel>
        <div className="mt-4 flex min-h-[52px] items-center justify-between rounded-card bg-raised px-4">
          <span>Discreet notifications</span>
          <Toggle checked={discreet} onChange={setDiscreet} label="Discreet notifications" />
        </div>
        <div className="mt-4 rounded-card bg-raised p-4">
          <p className="text-[13px] leading-[18px] text-text-2">Preview</p>
          <p className="mt-1 text-[15px] leading-5">WillWar: Day 12. Tap to check in.</p>
        </div>
        {note && <p className="mt-3 text-[13px] leading-[18px] text-text-2">{note}</p>}
      </div>
      <div className="mt-auto space-y-2 pt-8">
        <Button onClick={allow}>Allow reminders</Button>
        <Button variant="plain" className="w-full" onClick={onDone}>Not now</Button>
      </div>
    </section>
  );
}
