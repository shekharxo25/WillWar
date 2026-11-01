"use client";

import {
  ArrowLeft,
  BellRinging,
  CheckCircle,
  DeviceMobileSlash,
  DiceFive,
  DotsThree,
  Flag,
  HandsPraying,
  Lock,
  Moon,
  Mountains,
  Phone,
  Target,
  UsersThree,
  Waves,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InstallSteps } from "@/components/app/InstallCoach";
import { isStandalone } from "@/components/app/ServiceWorker";
import { Button } from "@/components/ui/Button";
import { Chip, Switch } from "@/components/ui/Controls";
import { HoldButton } from "@/components/ui/HoldButton";
import { useHud } from "@/components/ui/Hud";
import { Pebble } from "@/components/ui/Pebble";
import { WheelPicker } from "@/components/ui/WheelPicker";
import { cloudEnabled } from "@/env";
import {
  CURRENT_SEASON,
  MAX_WHY_TAGS,
  TONE_LABELS,
  TONE_SAMPLES,
  TONES,
  type Tone,
  WHY_TAG_LABELS,
  WHY_TAG_PLEDGE,
  WHY_TAGS,
  type WhyTag,
} from "@/lib/domain/constants";
import { handleError, isAdult, normaliseHandle, seasonStartInstant, startWindow } from "@/lib/domain/rules";
import { consumePendingJoin } from "@/lib/social/pending";
import { useWillWar } from "@/lib/store/provider";
import { errorMessage } from "@/lib/store/types";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { addDays, deviceTimeZone, formatCountdown, formatLongDay, localDate, toLocalDate } from "@/lib/time";

type Step = "age" | "under18" | "challenge" | "reason" | "pledge" | "tone" | "handle" | "account" | "install" | "reminders";
type ChallengeKind = "season" | "thirty" | "custom";

interface Draft {
  birth: { d: number; m: number; y: number };
  kind: ChallengeKind;
  customEnd: string;
  alreadyStarted: boolean;
  startedAtLocal: string; // datetime-local value
  why: WhyTag[];
  pledgeSigned: boolean;
  tone: Tone;
  handle: string;
  avatarSeed: string;
}

const DRAFT_KEY = "ww-onboarding";
const PROGRESS: Step[] = ["challenge", "reason", "pledge", "tone", "handle", "account"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const WHY_ICONS: Record<WhyTag, ReactNode> = {
  focus: <Target size={16} aria-hidden />,
  discipline: <Mountains size={16} aria-hidden />,
  sleep: <Moon size={16} aria-hidden />,
  less_scrolling: <DeviceMobileSlash size={16} aria-hidden />,
  faith: <HandsPraying size={16} aria-hidden />,
  prove_it: <Flag size={16} aria-hidden />,
  friends: <UsersThree size={16} aria-hidden />,
  other: <DotsThree size={16} aria-hidden />,
};

const randomSeed = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");

function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function initialDraft(): Draft {
  return {
    birth: { d: 1, m: 1, y: 2000 },
    kind: CURRENT_SEASON.endsOn >= localDate(new Date(), deviceTimeZone()) ? "season" : "thirty",
    customEnd: "",
    alreadyStarted: false,
    startedAtLocal: "",
    why: [],
    pledgeSigned: false,
    tone: "steady",
    handle: "",
    avatarSeed: "",
  };
}

function restoreDraft(): { draft: Draft; step: Step } {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as { draft: Draft; step: Step };
  } catch {
    // start fresh
  }
  return { draft: { ...initialDraft(), avatarSeed: randomSeed() }, step: "age" };
}

export function Onboarding() {
  const router = useRouter();
  const { status, store, refresh } = useWillWar();
  const hud = useHud();
  // Onboarding renders only on the client: restore a saved draft (e.g. after the Google
  // redirect) straight into the initial state.
  const [restored] = useState(restoreDraft);
  const [step, setStep] = useState<Step>(restored.step);
  const [draft, setDraftState] = useState<Draft>(restored.draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishing = useRef(false);
  const tz = useMemo(() => deviceTimeZone(), []);
  const now = new Date();
  const todayLocal = localDate(now, tz);

  useEffect(() => {
    // Only people who arrive already onboarded skip ahead; finishing here continues the flow.
    if (status === "ready" && !finishing.current) router.replace("/app/today");
  }, [status, router]);

  const setDraft = (patch: Partial<Draft>) =>
    setDraftState((d) => {
      const next = { ...d, ...patch };
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft: next, step }));
      } catch {
        // storage unavailable: the flow still works without a redirect
      }
      return next;
    });

  const go = (s: Step) => {
    setError(null);
    setStep(s);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step: s }));
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0 });
  };

  // Goal + start window derived from the challenge choice.
  const seasonOpen = CURRENT_SEASON.endsOn >= todayLocal;
  const seasonStart = seasonStartInstant(CURRENT_SEASON, tz);
  const seasonUpcoming = seasonStart > now;
  const endsOn =
    draft.kind === "season" ? CURRENT_SEASON.endsOn : draft.kind === "thirty" ? addDays(todayLocal, 29) : draft.customEnd;
  const startWin = startWindow(now, draft.kind === "season" ? seasonStart : null);
  const defaultStart = draft.kind === "season" && seasonUpcoming ? seasonStart : now;
  const startedAt = draft.alreadyStarted && draft.startedAtLocal ? new Date(draft.startedAtLocal) : defaultStart;

  const birthDate = toLocalDate(draft.birth.y, draft.birth.m, draft.birth.d);
  const handle = normaliseHandle(draft.handle);
  const pledgeReason = draft.why.length ? WHY_TAG_PLEDGE[draft.why[0]] : "for myself";

  const finish = async () => {
    finishing.current = true;
    setBusy(true);
    setError(null);
    try {
      await store.completeOnboarding({
        handle,
        birthDate,
        timezone: tz,
        tone: draft.tone,
        whyTags: draft.why,
        seasonId: draft.kind === "season" ? CURRENT_SEASON.id : null,
        endsOn: draft.kind === "season" ? null : endsOn,
        startedAt: (startedAt < startWin.min ? startWin.min : startedAt > startWin.max ? startWin.max : startedAt).toISOString(),
        avatarSeed: draft.avatarSeed || undefined,
      });
      if (draft.pledgeSigned) await store.signPledge();
      else await store.logEvent("pledge_skipped");
      try {
        sessionStorage.removeItem(DRAFT_KEY); // the birth date goes with it
      } catch {
        // ignore
      }
      const joined = await consumePendingJoin().catch(() => null);
      await refresh();
      hud("Your clock is running.", <Waves size={18} weight="bold" />);
      if (joined) return router.replace(`/app/pact/${joined}`);
      go(isStandalone() ? "reminders" : "install");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = PROGRESS.indexOf(step);
  const back: Partial<Record<Step, Step>> = {
    challenge: "age",
    reason: "challenge",
    pledge: "reason",
    tone: "pledge",
    handle: "tone",
    account: "handle",
  };

  return (
    <main className="flex min-h-dvh flex-col px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
      <div className="flex h-11 items-center gap-3">
        {back[step] ? (
          <button
            type="button"
            onClick={() => go(back[step] as Step)}
            aria-label="Back"
            className="pressable -ml-2 flex size-11 items-center justify-center rounded-full text-label"
          >
            <ArrowLeft size={22} aria-hidden />
          </button>
        ) : (
          <Link href="/" className="pressable -ml-1 text-headline font-semibold" aria-label="WillWar home">
            WillWar
          </Link>
        )}
        {stepIndex >= 0 && (
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={PROGRESS.length} aria-valuenow={stepIndex + 1}>
            {PROGRESS.map((s, i) => (
              <span key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-tide" : "bg-tertiary"}`} />
            ))}
          </div>
        )}
        {step === "age" && cloudEnabled && (
          <Link href="/app/sign-in" className="pressable ml-auto min-h-11 content-center text-subhead text-tide">
            Sign in
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {step === "age" && (
          <Screen
            title="WillWar is for adults."
            body="Enter your date of birth. We use it once to confirm you're 18 or over and don't store it."
            primary={
              <Button full onClick={() => go(isAdult(birthDate, todayLocal) ? "challenge" : "under18")}>
                Continue
              </Button>
            }
          >
            <WheelPicker
              columns={[
                {
                  label: "Day",
                  value: draft.birth.d,
                  onChange: (v) => setDraft({ birth: { ...draft.birth, d: Number(v) } }),
                  options: Array.from({ length: new Date(draft.birth.y, draft.birth.m, 0).getDate() }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
                },
                {
                  label: "Month",
                  value: draft.birth.m,
                  onChange: (v) => {
                    const m = Number(v);
                    const max = new Date(draft.birth.y, m, 0).getDate();
                    setDraft({ birth: { ...draft.birth, m, d: Math.min(draft.birth.d, max) } });
                  },
                  options: MONTHS.map((label, i) => ({ value: i + 1, label })),
                },
                {
                  label: "Year",
                  value: draft.birth.y,
                  onChange: (v) => setDraft({ birth: { ...draft.birth, y: Number(v) } }),
                  options: Array.from({ length: 90 }, (_, i) => {
                    const y = now.getFullYear() - 10 - i;
                    return { value: y, label: String(y) };
                  }),
                },
              ]}
            />
            <p className="mt-4 flex gap-2 text-footnote text-label-2">
              <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
              Checked on this step and then discarded. It never reaches our servers&apos; records.
            </p>
          </Screen>
        )}

        {step === "under18" && (
          <Screen
            title="WillWar is for people 18 and over."
            body="If you're working on a habit, talk to someone you trust. Tele-MANAS is free and open 24/7 at 14416."
          >
            <a href="tel:14416" className="pressable mt-2 inline-flex min-h-11 items-center gap-2 text-headline text-tide">
              <Phone size={18} aria-hidden /> Call 14416
            </a>
          </Screen>
        )}

        {step === "challenge" && (
          <Screen
            title="Pick your challenge."
            primary={
              <Button full disabled={draft.kind === "custom" && !draft.customEnd} onClick={() => go("reason")}>
                Continue
              </Button>
            }
          >
            <div className="grid gap-3" role="radiogroup" aria-label="Challenge">
              {seasonOpen && (
                <ChoiceCard
                  selected={draft.kind === "season"}
                  onSelect={() => setDraft({ kind: "season" })}
                  title={CURRENT_SEASON.name}
                  subtitle="1–30 November"
                  extra={
                    seasonUpcoming ? (
                      <span className="rounded-full bg-tide-wash px-2.5 py-1 text-footnote font-semibold text-tide">
                        Starts in {formatCountdown(seasonStart.getTime() - now.getTime())}
                      </span>
                    ) : null
                  }
                />
              )}
              <ChoiceCard
                selected={draft.kind === "thirty"}
                onSelect={() => setDraft({ kind: "thirty" })}
                title="30 days from today"
                subtitle={`Ends ${formatLongDay(addDays(todayLocal, 29))}`}
              />
              <ChoiceCard
                selected={draft.kind === "custom"}
                onSelect={() => setDraft({ kind: "custom" })}
                title="Set my own end date"
                subtitle={draft.customEnd ? `Ends ${formatLongDay(draft.customEnd)}` : "Up to a year from today"}
              >
                {draft.kind === "custom" && (
                  <label className="mt-3 block">
                    <span className="sr-only">End date</span>
                    <input
                      type="date"
                      min={addDays(todayLocal, 1)}
                      max={addDays(todayLocal, 365)}
                      value={draft.customEnd}
                      onChange={(e) => setDraft({ customEnd: e.target.value })}
                      className="h-[52px] w-full rounded-cell bg-grouped px-3 text-body"
                    />
                  </label>
                )}
              </ChoiceCard>
            </div>
            {!(draft.kind === "season" && seasonUpcoming) && (
              <div className="mt-4 rounded-card bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-body">I&apos;ve already started</p>
                    <p className="text-footnote text-label-2">Honor system. Your pact trusts you.</p>
                  </div>
                  <Switch
                    label="I've already started"
                    checked={draft.alreadyStarted}
                    onCheckedChange={(v) => setDraft({ alreadyStarted: v, startedAtLocal: v ? toDatetimeLocal(startWin.min) : "" })}
                  />
                </div>
                {draft.alreadyStarted && (
                  <label className="mt-3 block">
                    <span className="text-footnote text-label-2">When did you start?</span>
                    <input
                      type="datetime-local"
                      min={toDatetimeLocal(startWin.min)}
                      max={toDatetimeLocal(startWin.max)}
                      value={draft.startedAtLocal}
                      onChange={(e) => setDraft({ startedAtLocal: e.target.value })}
                      className="mt-1 h-[52px] w-full rounded-cell bg-grouped px-3 text-body"
                    />
                  </label>
                )}
              </div>
            )}
          </Screen>
        )}

        {step === "reason" && (
          <Screen
            title="What's it for?"
            body={`Pick up to ${MAX_WHY_TAGS}. Your morning line uses these.`}
            primary={
              <Button full disabled={draft.why.length === 0} onClick={() => go("pledge")}>
                Continue
              </Button>
            }
          >
            <div className="flex flex-wrap gap-2">
              {WHY_TAGS.map((t) => {
                const on = draft.why.includes(t);
                return (
                  <Chip
                    key={t}
                    selected={on}
                    icon={WHY_ICONS[t]}
                    disabled={!on && draft.why.length >= MAX_WHY_TAGS}
                    onClick={() => setDraft({ why: on ? draft.why.filter((x) => x !== t) : [...draft.why, t] })}
                  >
                    {WHY_TAG_LABELS[t]}
                  </Chip>
                );
              })}
            </div>
          </Screen>
        )}

        {step === "pledge" && (
          <Screen
            title="Make it official."
            body="A boundary you set for yourself. No scoreboard. Just your word."
            primary={
              <div className="grid gap-2">
                <HoldButton
                  label="Hold to sign"
                  doneLabel="Pledge signed"
                  icon={<Waves size={22} weight="bold" aria-hidden />}
                  onComplete={() => {
                    setDraft({ pledgeSigned: true });
                    hud("Pledge signed.");
                    setTimeout(() => go("tone"), 900);
                  }}
                />
                <Button variant="plain" full onClick={() => go("tone")}>
                  Skip
                </Button>
              </div>
            }
          >
            <blockquote className="rounded-sheet bg-surface p-6 text-title-2 font-semibold">
              &ldquo;Until {formatLongDay(endsOn || addDays(todayLocal, 29))}, I&apos;ll ride out the urge instead of giving in. I&apos;m doing
              it {pledgeReason}.&rdquo;
              {draft.pledgeSigned && (
                <footer className="num mt-4 flex items-center gap-2 text-[1.375rem] text-tide">
                  <CheckCircle size={22} weight="fill" aria-hidden /> Signed {formatLongDay(todayLocal)}
                </footer>
              )}
            </blockquote>
            <p className="mt-3 text-footnote text-label-2">Hold for 3 seconds, or hold the Space key.</p>
          </Screen>
        )}

        {step === "tone" && (
          <Screen
            title="How should your morning line sound?"
            primary={
              <Button full onClick={() => go("handle")}>
                Continue
              </Button>
            }
          >
            <div className="grid gap-2" role="radiogroup" aria-label="Tone">
              {TONES.map((t) => (
                <ChoiceCard key={t} selected={draft.tone === t} onSelect={() => setDraft({ tone: t })} title={TONE_LABELS[t]}>
                  {draft.tone === t && <p className="mt-2 text-body text-label-2">&ldquo;{TONE_SAMPLES[t]}&rdquo;</p>}
                </ChoiceCard>
              ))}
            </div>
          </Screen>
        )}

        {step === "handle" && (
          <HandleStep
            value={draft.handle}
            seed={draft.avatarSeed}
            onChange={(h) => setDraft({ handle: h })}
            onShuffle={() => setDraft({ avatarSeed: randomSeed() })}
            onContinue={() => go("account")}
          />
        )}

        {step === "account" && (
          <AccountStep onCreate={finish} busy={busy} error={error} signedIn={status === "needs-onboarding"} />
        )}

        {step === "install" && (
          <Screen
            title="Put WillWar on your Home Screen."
            primary={
              <div className="grid gap-2">
                <Button full onClick={() => router.push("/app/pro?from=onboarding")}>
                  I&apos;ve added it
                </Button>
                <Button variant="plain" full onClick={() => router.push("/app/pro?from=onboarding")}>
                  Not now
                </Button>
              </div>
            }
          >
            <InstallSteps />
          </Screen>
        )}

        {step === "reminders" && <RemindersStep onDone={() => router.push("/app/pro?from=onboarding")} />}
      </div>
    </main>
  );
}

function Screen({ title, body, children, primary }: { title: string; body?: string; children?: ReactNode; primary?: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col">
      <h1 className="text-large-title font-bold text-balance">{title}</h1>
      {body && <p className="mt-2 text-body text-label-2">{body}</p>}
      <div className="mt-6">{children}</div>
      {primary && <div className="mt-auto pt-8">{primary}</div>}
    </section>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  subtitle,
  extra,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onSelect())}
      className={`pressable cursor-pointer rounded-card bg-surface p-4 text-left ${selected ? "ring-2 ring-tide" : "ring-[0.5px] ring-separator"}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-headline">{title}</p>
          {subtitle && <p className="text-subhead text-label-2">{subtitle}</p>}
        </div>
        <span
          aria-hidden
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${selected ? "bg-tide text-on-tide" : "ring-1 ring-label-3"}`}
        >
          {selected && <CheckCircle size={24} weight="fill" />}
        </span>
      </div>
      {extra && <div className="mt-3">{extra}</div>}
      {children}
    </div>
  );
}

function HandleStep({
  value,
  seed,
  onChange,
  onShuffle,
  onContinue,
}: {
  value: string;
  seed: string;
  onChange: (h: string) => void;
  onShuffle: () => void;
  onContinue: () => void;
}) {
  const { store } = useWillWar();
  const [result, setResult] = useState<{ handle: string; ok: boolean } | null>(null);
  const handle = normaliseHandle(value);
  const formatError = value ? handleError(value) : null;
  // Availability belongs to the handle it was checked for; a new handle starts unknown.
  const available = result && result.handle === handle ? result.ok : null;

  useEffect(() => {
    if (!handle || formatError) return;
    const t = setTimeout(() => {
      store
        .checkHandleAvailable(handle)
        .then((ok) => setResult({ handle, ok }))
        .catch(() => setResult(null));
    }, 400);
    return () => clearTimeout(t);
  }, [handle, formatError, store]);

  return (
    <Screen
      title="Pick a handle."
      body="Your pact sees this. Don't use your real name."
      primary={
        <Button full disabled={!handle || Boolean(formatError) || available === false} onClick={onContinue}>
          Continue
        </Button>
      }
    >
      <label className="block">
        <span className="sr-only">Handle</span>
        <div className="flex h-[52px] items-center rounded-cell bg-surface px-3 ring-[0.5px] ring-separator focus-within:ring-2 focus-within:ring-tide">
          <span className="text-body text-label-2">@</span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            placeholder="quietmile"
            aria-describedby="handle-help"
            aria-invalid={Boolean(formatError) || available === false}
            className="h-full flex-1 bg-transparent px-1 text-body outline-none"
          />
          {available && !formatError && <span className="text-footnote font-semibold text-tide">Available</span>}
        </div>
      </label>
      <p id="handle-help" className={`mt-2 text-footnote ${formatError || available === false ? "text-destructive" : "text-label-2"}`}>
        {formatError ?? (available === false ? "That handle is taken. Try another." : "Use 3–20 letters, numbers or underscores.")}
      </p>
      <div className="mt-6 flex items-center gap-4 rounded-card bg-surface p-5">
        <Pebble seed={seed || "willwar"} size={72} label="Your avatar pebble" />
        <div className="flex-1">
          <p className="text-headline">Your pebble</p>
          <p className="text-subhead text-label-2">No photos, ever. Shuffle until one feels like yours.</p>
        </div>
        <button type="button" onClick={onShuffle} aria-label="Shuffle pebble" className="pressable glass flex size-11 items-center justify-center rounded-full text-tide">
          <DiceFive size={22} aria-hidden />
        </button>
      </div>
    </Screen>
  );
}

function AccountStep({
  onCreate,
  busy,
  error,
  signedIn,
}: {
  onCreate: () => Promise<void>;
  busy: boolean;
  error: string | null;
  signedIn: boolean;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!cloudEnabled || signedIn) {
    return (
      <Screen
        title="Save your streak."
        body={
          cloudEnabled
            ? "You're signed in. Create your account to start the clock."
            : "Your account lives on this device. No email, and nothing leaves your phone."
        }
        primary={
          <div className="grid gap-2">
            {error && <p className="text-footnote text-destructive" role="alert">{error}</p>}
            <Button full busy={busy} onClick={() => void onCreate()}>
              Create my account
            </Button>
          </div>
        }
      >
        {!cloudEnabled && (
          <p className="rounded-card bg-surface p-4 text-subhead text-label-2">
            Pacts, Pro and backups need an online account, which this build doesn&apos;t have yet. Install WillWar so your
            browser keeps your data safe.
          </p>
        )}
      </Screen>
    );
  }

  const sendCode = async () => {
    setAuthBusy(true);
    setAuthError(null);
    const { error: e } = await getBrowserSupabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setAuthBusy(false);
    if (e) setAuthError("We couldn't send a code to that address. Check it and try again.");
    else setPhase("code");
  };

  const verify = async () => {
    setAuthBusy(true);
    setAuthError(null);
    const { error: e } = await getBrowserSupabase().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setAuthBusy(false);
    if (e) return setAuthError("That code didn't work. Check the latest email and try again.");
    await onCreate();
  };

  const google = async () => {
    await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/auth/callback?next=/app/start` },
    });
  };

  return (
    <Screen
      title={phase === "email" ? "Save your streak." : "Enter your code."}
      body={phase === "email" ? "We'll email you a 6-digit code. No password." : `We sent a 6-digit code to ${email}.`}
      primary={
        <div className="grid gap-2">
          {(authError || error) && (
            <p className="text-footnote text-destructive" role="alert">
              {authError ?? error}
            </p>
          )}
          {phase === "email" ? (
            <>
              <Button full busy={authBusy} disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={sendCode}>
                Continue with email
              </Button>
              <Button variant="secondary" full onClick={google}>
                Continue with Google
              </Button>
            </>
          ) : (
            <>
              <Button full busy={authBusy || busy} disabled={!/^\d{6}$/.test(code)} onClick={verify}>
                Create my account
              </Button>
              <Button variant="plain" full onClick={() => setPhase("email")}>
                Use a different email
              </Button>
            </>
          )}
        </div>
      }
    >
      {phase === "email" ? (
        <label className="block">
          <span className="text-footnote text-label-2">Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-body ring-[0.5px] ring-separator focus:ring-2 focus:ring-tide focus:outline-none"
          />
        </label>
      ) : (
        <label className="block">
          <span className="text-footnote text-label-2">6-digit code</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="num mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-center text-[1.5rem] tracking-[0.3em] ring-[0.5px] ring-separator focus:ring-2 focus:ring-tide focus:outline-none"
          />
        </label>
      )}
      <p className="mt-4 text-footnote text-label-2">Emails come from WillWar with plain subject lines.</p>
    </Screen>
  );
}

function RemindersStep({ onDone }: { onDone: () => void }) {
  const [time, setTime] = useState("21:30");
  const [discreet, setDiscreet] = useState(true);
  const save = async (allow: boolean) => {
    try {
      localStorage.setItem("ww-reminder", JSON.stringify({ time, discreet, enabled: allow }));
    } catch {
      // ignore
    }
    if (allow && "Notification" in window) await Notification.requestPermission().catch(() => undefined);
    onDone();
  };
  return (
    <Screen
      title="When should we check in?"
      primary={
        <div className="grid gap-2">
          <Button full icon={<BellRinging size={20} aria-hidden />} onClick={() => void save(true)}>
            Allow reminders
          </Button>
          <Button variant="plain" full onClick={() => void save(false)}>
            Not now
          </Button>
        </div>
      }
    >
      <label className="block">
        <span className="text-footnote text-label-2">Daily reminder</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="num mt-1 h-[52px] w-full rounded-cell bg-surface px-3 text-body" />
      </label>
      <div className="mt-4 flex items-center gap-3 rounded-card bg-surface p-4">
        <div className="flex-1">
          <p className="text-body">Discreet notifications</p>
          <p className="text-footnote text-label-2">WillWar · Day 12. Tap to check in.</p>
        </div>
        <Switch label="Discreet notifications" checked={discreet} onCheckedChange={setDiscreet} />
      </div>
    </Screen>
  );
}
