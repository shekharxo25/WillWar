"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CaretLeft, Export, PlusSquare, DeviceMobile } from "@phosphor-icons/react";
import { useApp, useNow } from "@/components/AppProvider";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { HoldButton } from "@/components/ui/HoldButton";
import { Input } from "@/components/ui/Input";
import { LockerPlate } from "@/components/ui/LockerPlate";
import { Toggle } from "@/components/ui/Cell";
import { Wheel, WheelColumn } from "@/components/ui/WheelPicker";
import { Paywall } from "@/components/pro/Paywall";
import { EmailCode, signInWithGoogle } from "./EmailCode";
import { SEASON, SEASON_MODE } from "@/lib/config/season";
import { CRISIS_RESOURCES } from "@/lib/config/crisis-resources";
import { addDays, deviceTimeZone, elapsed, localDate, longDate, shortDate, zonedMidnight } from "@/lib/time";
import { isAdult } from "@/lib/store/engine";
import { StoreError, WHY_TAGS, type Tone } from "@/lib/store/types";
import { isStandalone, platform } from "@/lib/pwa";
import { Reminders } from "./Reminders";

type Step = "age" | "under18" | "challenge" | "reason" | "pledge" | "tone" | "handle" | "account" | "install" | "reminders" | "paywall";
const PROGRESS: Step[] = ["challenge", "reason", "pledge", "tone", "handle", "account"];

type Draft = {
  birth: { y: number; m: number; d: number };
  challenge: "season" | "thirty" | "custom" | null;
  customEnd: string;
  alreadyStarted: boolean;
  startedHoursAgo: number | "season";
  why: string[];
  pledgeSigned: boolean;
  tone: Tone | null;
  handle: string;
  seed: string;
};

export const TONE_SAMPLES: Record<Tone, string> = {
  steady: "Day 9. You've handled nine evenings like this one. Handle tonight the same way.",
  stoic: "Day 9. The urge wants your attention. Give it three minutes and nothing more.",
  coach: "Day 9. Phone out of the bedroom tonight. That's the game plan.",
  playful: "Day 9. One more and you're in double digits. Don't stop at the bell.",
};

const DRAFT_KEY = "ww.onboarding"; // sessionStorage only; cleared when onboarding completes

function randomSeed() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function Onboarding() {
  const { store, refresh, toast, snap, loading } = useApp();
  const router = useRouter();
  const now = useNow(1000);
  const tz = useMemo(() => (typeof window === "undefined" ? "Asia/Kolkata" : deviceTimeZone()), []);
  const [step, setStep] = useState<Step>("age");
  const [history, setHistory] = useState<Step[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>({
    birth: { y: 2000, m: 1, d: 1 },
    challenge: null,
    customEnd: "",
    alreadyStarted: false,
    startedHoursAgo: 0,
    why: [],
    pledgeSigned: false,
    tone: null,
    handle: "",
    seed: "000000",
  });
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  // Restore a draft after the Google redirect; returning users with a record go to Today.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      const params = new URLSearchParams(location.search);
      if (raw && params.get("resume") === "1") {
        const saved = JSON.parse(raw) as { draft: Draft };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setD(saved.draft);
        setStep("account");
        return;
      }
    } catch {}
    setD((x) => ({ ...x, seed: randomSeed() }));
  }, []);
  useEffect(() => {
    if (!loading && snap && ["age", "challenge"].includes(step)) router.replace("/app/today");
  }, [loading, snap, step, router]);

  const go = (s: Step) => {
    setErr(null);
    setHistory((h) => [...h, step]);
    setStep(s);
    window.scrollTo(0, 0);
  };
  const back = () => {
    setErr(null);
    setHistory((h) => {
      const prev = h.at(-1);
      if (prev) setStep(prev);
      return h.slice(0, -1);
    });
  };

  const today = now ? localDate(now, tz) : null;
  const seasonOpen = SEASON_MODE === "nnn" && (!today || today <= SEASON.endsOn);
  const seasonStart = zonedMidnight(SEASON.startsOn, tz);
  const seasonStarted = !!now && now >= seasonStart;
  const endsOn =
    d.challenge === "season" ? SEASON.endsOn : d.challenge === "thirty" && today ? addDays(today, 29) : d.challenge === "custom" ? d.customEnd : "";

  const startedAt = (): string => {
    const n = new Date();
    if (d.challenge === "season" && n < seasonStart) return seasonStart.toISOString();
    if (!d.alreadyStarted) return n.toISOString();
    if (d.startedHoursAgo === "season") return seasonStart.toISOString();
    return new Date(n.getTime() - d.startedHoursAgo * 3600_000).toISOString();
  };

  const finish = async () => {
    setBusy(true);
    setErr(null);
    const birthDate = `${d.birth.y}-${String(d.birth.m).padStart(2, "0")}-${String(d.birth.d).padStart(2, "0")}`;
    try {
      await store.completeOnboarding({
        handle: d.handle,
        birthDate,
        timezone: tz,
        tone: d.tone ?? "steady",
        why: d.why,
        seasonId: d.challenge === "season" ? SEASON.id : null,
        endsOn: d.challenge === "season" ? null : endsOn,
        startedAt: startedAt(),
        pledgeSigned: d.pledgeSigned,
        country: tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "IN" : tz.startsWith("America/") ? "US" : tz === "Europe/London" ? "GB" : null,
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
      // A camp invite opened before sign-up joins now.
      try {
        const code = localStorage.getItem("ww.joinCode");
        if (code) {
          localStorage.removeItem("ww.joinCode");
          await store.joinCamp(code).catch(() => undefined);
        }
      } catch {}
      await refresh();
      if (!isStandalone()) go("install");
      else if ("Notification" in window) go("reminders");
      else go("paywall");
    } catch (e) {
      const c = e instanceof StoreError ? e.code : "unknown";
      setErr(
        {
          must_be_18: "WillWar is for people 18 and over.",
          bad_end_date: "Pick an end date between tomorrow and a year from today.",
          start_out_of_range: "Your start can be up to 48 hours back, or the season start.",
          season_over: "This season has ended. Pick 30 days from today.",
          bad_handle: "Handles use 3 to 20 lowercase letters, numbers or underscores.",
        }[c] ?? (c.includes("duplicate") || c.includes("handle") ? "That handle was just taken. Try another." : "Something went wrong saving your record. Try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  const done = () => {
    toast("Your clock is running.");
    router.replace("/app/today");
  };

  const idx = PROGRESS.indexOf(step);
  const canBack = step !== "age" && step !== "under18" && history.length > 0 && !["install", "reminders", "paywall"].includes(step);

  return (
    <main className="pt-safe flex min-h-dvh flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] min-[414px]:px-5">
      <div className="flex h-11 items-center gap-2">
        {canBack ? (
          <button type="button" onClick={back} aria-label="Back" className="press -ml-2 flex h-11 w-11 items-center justify-center">
            <CaretLeft weight="bold" size={22} />
          </button>
        ) : (
          <span className="w-9" />
        )}
        {idx >= 0 && (
          <div className="flex flex-1 gap-1" aria-label={`Step ${idx + 1} of ${PROGRESS.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={PROGRESS.length} aria-valuenow={idx + 1}>
            {PROGRESS.map((s, i) => (
              <span key={s} className={`h-[3px] flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-[var(--hairline)]"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {step === "age" && (
          <Section title="WILLWAR IS FOR ADULTS." body="Enter your date of birth. We use it once to confirm you're 18 or over and don't store it.">
            <DobWheel value={d.birth} onChange={(birth) => set({ birth })} year={now?.getFullYear() ?? Number(SEASON.startsOn.slice(0, 4))} />
            <Footer>
              <Button
                onClick={() => {
                  const b = `${d.birth.y}-${String(d.birth.m).padStart(2, "0")}-${String(d.birth.d).padStart(2, "0")}`;
                  go(isAdult(b, new Date()) ? "challenge" : "under18");
                }}
              >
                Continue
              </Button>
            </Footer>
          </Section>
        )}

        {step === "under18" && (
          <Section title="NOT YET." body="WillWar is for people 18 and over. If you're working on a habit, talk to someone you trust. Tele-MANAS is free and open 24/7 at 14416.">
            <a href={CRISIS_RESOURCES[0].href} className="press mt-2 inline-flex min-h-[44px] items-center text-[17px] font-semibold underline underline-offset-4">Call 14416</a>
            <p className="mt-4 text-[13px] leading-[18px] text-text-2">No account was created and nothing was stored.</p>
          </Section>
        )}

        {step === "challenge" && (
          <Section title="PICK YOUR CHALLENGE.">
            <div className="space-y-3">
              {seasonOpen && (
                <ChoiceCard selected={d.challenge === "season"} onClick={() => set({ challenge: "season" })} title={SEASON.name} sub="1–30 November">
                  {now && !seasonStarted && <SeasonCountdown to={seasonStart} now={now} />}
                </ChoiceCard>
              )}
              <ChoiceCard selected={d.challenge === "thirty"} onClick={() => set({ challenge: "thirty" })} title="30 days from today" sub={today ? `Ends ${shortDate(addDays(today, 29))}` : " "} />
              <ChoiceCard selected={d.challenge === "custom"} onClick={() => set({ challenge: "custom" })} title="Set my own end date" sub="Up to a year">
                {d.challenge === "custom" && today && (
                  <label className="mt-3 block">
                    <span className="sr-only">End date</span>
                    <input
                      type="date"
                      min={addDays(today, 1)}
                      max={addDays(today, 365)}
                      value={d.customEnd}
                      onChange={(e) => set({ customEnd: e.target.value })}
                      className="h-[52px] w-full rounded-button bg-bg px-4 text-[17px] text-text"
                    />
                  </label>
                )}
              </ChoiceCard>
            </div>
            {!(d.challenge === "season" && !seasonStarted) && d.challenge && (
              <div className="mt-6">
                <div className="flex min-h-[52px] items-center justify-between rounded-card bg-raised px-4">
                  <span>I&apos;ve already started</span>
                  <Toggle checked={d.alreadyStarted} onChange={(v) => set({ alreadyStarted: v })} label="I've already started" />
                </div>
                {d.alreadyStarted && (
                  <div className="mt-3">
                    <Wheel>
                      <WheelColumn
                        label="Started"
                        items={[...(d.challenge === "season" && seasonStarted && now && now.getTime() - seasonStart.getTime() > 48 * 3600_000 ? (["season"] as const) : []), ...Array.from({ length: 49 }, (_, i) => i)] as (number | "season")[]}
                        value={d.startedHoursAgo}
                        onChange={(v) => set({ startedHoursAgo: v })}
                        format={(v) => (v === "season" ? `Since ${shortDate(SEASON.startsOn)}` : v === 0 ? "Just now" : `${v} ${v === 1 ? "hour" : "hours"} ago`)}
                      />
                    </Wheel>
                    <p className="mt-2 px-1 text-[13px] leading-[18px] text-text-2">Honor system. Your camp trusts you.</p>
                  </div>
                )}
              </div>
            )}
            <Footer>
              <Button disabled={!d.challenge || (d.challenge === "custom" && !d.customEnd)} onClick={() => go("reason")}>Continue</Button>
            </Footer>
          </Section>
        )}

        {step === "reason" && (
          <Section title="WHAT'S IT FOR?" body="Pick up to 3.">
            <div className="flex flex-wrap gap-2">
              {WHY_TAGS.map((t) => {
                const on = d.why.includes(t.key);
                return (
                  <Chip key={t.key} selected={on} disabled={!on && d.why.length >= 3} onClick={() => set({ why: on ? d.why.filter((x) => x !== t.key) : [...d.why, t.key] })}>
                    {t.label}
                  </Chip>
                );
              })}
            </div>
            <Footer>
              <Button disabled={d.why.length === 0} onClick={() => go("pledge")}>Continue</Button>
            </Footer>
          </Section>
        )}

        {step === "pledge" && (
          <Section title="MAKE IT OFFICIAL.">
            <p className="text-[22px] leading-[28px]">
              Until {endsOn ? longDate(endsOn) : "the end"}, I&apos;ll last the round instead of giving in. I&apos;m doing it for{" "}
              {(WHY_TAGS.find((t) => t.key === d.why[0])?.label ?? "myself").toLowerCase()}.
            </p>
            <div className="mt-8 h-10 border-b border-[var(--text-2)]">
              {d.pledgeSigned && <span className="display stamp block text-[28px] leading-10">Signed {now ? shortDate(localDate(now, tz)) : ""}</span>}
            </div>
            <Footer>
              <HoldButton
                label="Hold to sign"
                doneLabel="Pledge signed."
                onDone={() => {
                  set({ pledgeSigned: true });
                  toast("Pledge signed.");
                  setTimeout(() => go("tone"), 700);
                }}
              />
              <Button variant="plain" className="w-full" onClick={() => go("tone")}>Skip</Button>
            </Footer>
          </Section>
        )}

        {step === "tone" && (
          <Section title="YOUR CORNER." body="Pick how your morning line sounds.">
            <div className="space-y-3">
              {(Object.keys(TONE_SAMPLES) as Tone[]).map((t) => (
                <ChoiceCard key={t} selected={d.tone === t} onClick={() => set({ tone: t })} title={t[0].toUpperCase() + t.slice(1)} sub={TONE_SAMPLES[t]} />
              ))}
            </div>
            <Footer>
              <Button disabled={!d.tone} onClick={() => go("handle")}>Continue</Button>
            </Footer>
          </Section>
        )}

        {step === "handle" && <HandleStep d={d} set={set} onNext={() => go("account")} cloud={store.mode === "cloud"} />}

        {step === "account" && (
          <Section title="SAVE YOUR RECORD." body={store.mode === "cloud" ? undefined : "This build runs in device mode: your record lives on this phone and nothing leaves it."}>
            {store.mode === "cloud" ? (
              <div className="space-y-3">
                <EmailCode onSignedIn={finish} />
                <div className="py-1 text-center text-[13px] text-text-2">or</div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft: d }));
                    } catch {}
                    void signInWithGoogle("/app/start?resume=1");
                  }}
                >
                  Continue with Google
                </Button>
                <p className="pt-2 text-[13px] leading-[18px] text-text-2">Emails come from WillWar with plain subject lines.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={finish} disabled={busy}>
                  <DeviceMobile weight="bold" size={20} aria-hidden /> Save on this phone
                </Button>
                <p className="text-[13px] leading-[18px] text-text-2">Export or delete it any time in Settings. Accounts with email codes switch on when the cloud backend is connected.</p>
              </div>
            )}
            {err && <p className="mt-3 text-[13px] leading-[18px] text-destructive">{err}</p>}
            <ResumeAfterOAuth onReady={finish} />
          </Section>
        )}

        {step === "install" && (
          <Section title="PUT IT ON YOUR HOME SCREEN." body="Installed, WillWar can remind you each day and works offline.">
            <InstallSteps />
            <Footer>
              <Button variant="plain" className="w-full" onClick={() => go("paywall")}>Not now</Button>
            </Footer>
          </Section>
        )}

        {step === "reminders" && <Reminders onDone={() => go("paywall")} />}

        {step === "paywall" && <Paywall source="onboarding" onContinueFree={done} onPro={done} />}
      </div>
    </main>
  );
}

function Section({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-1 flex-col">
      <h1 className="display text-[40px] leading-[40px]">{title}</h1>
      {body && <p className="mt-3 text-[17px] leading-[22px] text-text-2">{body}</p>}
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto space-y-2 pt-8">{children}</div>;
}

function ChoiceCard({ selected, onClick, title, sub, children }: { selected: boolean; onClick: () => void; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-card bg-raised ${selected ? "shadow-[inset_0_0_0_2px_var(--text)]" : ""}`}>
      <button type="button" aria-pressed={selected} onClick={onClick} className="press block w-full p-4 text-left">
        <span className="block text-[17px] leading-[22px] font-semibold">{title}</span>
        {sub && <span className="mt-1 block text-[15px] leading-5 text-text-2">{sub}</span>}
      </button>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function SeasonCountdown({ to, now }: { to: Date; now: Date }) {
  const e = elapsed(now, to);
  return <p className="text-[13px] leading-[18px] text-text-2">Starts in {e.days} d {e.hours} h {e.minutes} m</p>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function DobWheel({ value, onChange, year }: { value: Draft["birth"]; onChange: (v: Draft["birth"]) => void; year: number }) {
  const years = Array.from({ length: 90 }, (_, i) => year - 10 - i);
  const dim = new Date(Date.UTC(value.y, value.m, 0)).getUTCDate();
  const days = Array.from({ length: dim }, (_, i) => i + 1);
  return (
    <Wheel>
      <WheelColumn label="Day" items={days} value={Math.min(value.d, dim)} onChange={(v) => onChange({ ...value, d: v })} width="w-16" />
      <WheelColumn label="Month" items={MONTHS.map((_, i) => i + 1)} value={value.m} onChange={(v) => onChange({ ...value, m: v, d: Math.min(value.d, new Date(Date.UTC(value.y, v, 0)).getUTCDate()) })} format={(v) => MONTHS[v - 1]} />
      <WheelColumn label="Year" items={years} value={value.y} onChange={(v) => onChange({ ...value, y: v })} width="w-24" />
    </Wheel>
  );
}

function HandleStep({ d, set, onNext, cloud }: { d: Draft; set: (p: Partial<Draft>) => void; onNext: () => void; cloud: boolean }) {
  const { store } = useApp();
  const [state, setState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const valid = /^[a-z0-9_]{3,20}$/.test(d.handle);
  useEffect(() => {
    if (!d.handle || !valid) return;
    const t = setTimeout(async () => {
      try {
        setState((await store.handleAvailable(d.handle)) ? "ok" : "taken");
      } catch {
        setState("ok");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [d.handle, valid, store]);
  const shown = !d.handle ? "idle" : !valid ? "invalid" : state === "idle" || state === "invalid" ? "checking" : state;
  const msg =
    shown === "invalid" ? "Use 3 to 20 lowercase letters, numbers or underscores." : shown === "taken" ? "That handle is taken or not allowed. Try another." : null;
  return (
    <Section title="PICK A HANDLE." body="Your camp sees this. Don't use your real name.">
      <div className="flex items-center gap-3">
        <LockerPlate seed={d.seed} size={52} />
        <div className="flex-1">
          <Input
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="handle"
            value={d.handle}
            onChange={(e) => { set({ handle: e.target.value.toLowerCase().replace(/\s/g, "") }); setState("checking"); }}
            aria-describedby="handle-status"
          />
        </div>
      </div>
      <p id="handle-status" className={`mt-2 min-h-[18px] text-[13px] leading-[18px] ${msg ? "text-destructive" : "text-text-2"}`}>
        {msg ?? (shown === "checking" ? "Checking…" : shown === "ok" ? "Available." : "")}
      </p>
      {!cloud && (
        <Button variant="plain" className="self-start" onClick={() => set({ seed: randomSeed() })}>Shuffle</Button>
      )}
      <Footer>
        <Button disabled={shown !== "ok"} onClick={onNext}>Continue</Button>
      </Footer>
    </Section>
  );
}

function ResumeAfterOAuth({ onReady }: { onReady: () => void }) {
  const [fired, setFired] = useState(false);
  useEffect(() => {
    if (fired) return;
    if (new URLSearchParams(location.search).get("resume") !== "1") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFired(true);
    onReady();
  }, [fired, onReady]);
  return null;
}

function InstallSteps() {
  const [p, setP] = useState<"ios" | "android" | "other">("other");
  const [prompt, setPrompt] = useState<Event & { prompt?: () => Promise<void> } | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setP(platform());
    const on = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Event & { prompt?: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  if (p === "ios")
    return (
      <ol className="space-y-3">
        {[
          { icon: <Export size={22} weight="bold" />, t: "Tap Share in Safari's toolbar." },
          { icon: <PlusSquare size={22} weight="bold" />, t: "Choose Add to Home Screen." },
          { icon: <DeviceMobile size={22} weight="bold" />, t: "Open WillWar from your home screen." },
        ].map((s, i) => (
          <li key={i} className="flex items-center gap-4 rounded-card bg-raised p-4">
            <span className="display text-[28px] leading-none text-text-2">{i + 1}</span>
            <span className="text-text-2" aria-hidden>{s.icon}</span>
            <span>{s.t}</span>
          </li>
        ))}
      </ol>
    );
  return (
    <div className="space-y-3">
      {prompt?.prompt ? (
        <Button onClick={() => prompt.prompt?.()}>Install WillWar</Button>
      ) : (
        <p className="rounded-card bg-raised p-4 text-[15px] leading-5 text-text-2">
          Open your browser menu and choose Install app or Add to Home screen.
        </p>
      )}
    </div>
  );
}
