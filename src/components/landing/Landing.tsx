import {
  ArrowSquareOut,
  BellSimpleSlash,
  BookOpenText,
  Check,
  CheckCircle,
  DeviceMobile,
  EyeSlash,
  HandWaving,
  IdentificationBadge,
  Prohibit,
  SealCheck,
  ShieldCheck,
  Sparkle,
  Trash,
  Trophy,
  Waves,
} from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "@/components/brand/Mark";
import { publicEnv } from "@/env";
import { ALL_ARTICLES, getArticle, GRADE_LABEL } from "@/lib/learn/articles";
import { Ocean } from "./Ocean";
import {
  GameChips,
  HeroClock,
  HeroPhone,
  PactBoard,
  RideDemo,
  SiteHeader,
  SkyBackdrop,
  ThirtyDays,
  ToneCards,
  WarChestDemo,
} from "./islands";

const TICKER: { text: string; icon: ReactNode; tint: string }[] = [
  { text: "Day 7 held.", icon: <SealCheck size={16} weight="fill" />, tint: "bg-harbor" },
  { text: "Wave passed.", icon: <Waves size={16} weight="bold" />, tint: "bg-glacier" },
  { text: "Pledge signed.", icon: <CheckCircle size={16} weight="fill" />, tint: "bg-dawn" },
  { text: "Nudge sent.", icon: <HandWaving size={16} weight="fill" />, tint: "bg-glacier-deep" },
  { text: "Day 14. Halfway.", icon: <Trophy size={16} weight="fill" />, tint: "bg-sun text-night" },
  { text: "Day 1 counts.", icon: <Sparkle size={16} weight="fill" />, tint: "bg-dawn-deep" },
  { text: "Shield used for Tue 10 Nov.", icon: <ShieldCheck size={16} weight="fill" />, tint: "bg-harbor" },
  { text: "Your clock is running.", icon: <Waves size={16} weight="bold" />, tint: "bg-glacier" },
];

function CtaButton({ children = "Start my 30 days", big }: { children?: ReactNode; big?: boolean }) {
  return (
    <Link
      href="/app/start"
      className={`pressable group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-dawn via-[color-mix(in_oklab,var(--dawn)_50%,var(--sun))] to-sun font-semibold text-night shadow-[0_12px_40px_rgb(200_100_74/0.5)] ${
        big ? "h-16 px-10 text-[1.1875rem]" : "h-14 px-8 text-headline"
      }`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/35 motion-safe:animate-[sheen_3.2s_ease-in-out_infinite]"
      />
      <span className="relative">{children}</span>
    </Link>
  );
}

function Eyebrow({ children, tone = "text-harbor-bright" }: { children: ReactNode; tone?: string }) {
  return <p className={`text-subhead font-semibold ${tone}`}>{children}</p>;
}

export function Landing() {
  const offSeason = publicEnv.NEXT_PUBLIC_SEASON_MODE === "rolling";
  const season = publicEnv.NEXT_PUBLIC_PRICE_SEASON_INR;
  const annual = publicEnv.NEXT_PUBLIC_PRICE_ANNUAL_INR;
  const featured = ["day-7-testosterone-claim", "one-slip-abstinence-violation", "three-minutes-puzzle-craving"]
    .map((s) => ALL_ARTICLES.find((a) => a.slug === s))
    .filter((a) => a !== undefined);

  return (
    <div className="landing relative isolate overflow-x-clip bg-night text-white">
      <SkyBackdrop />
      <SiteHeader />

      {/* ---------------------------------------------------------- Hero: night sea */}
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden pt-24" aria-labelledby="hero-title">
        <div
          aria-hidden
          className="landing-moon pointer-events-none absolute top-[4.5rem] right-3 size-14 rounded-full sm:top-24 sm:right-[8%] sm:size-32"
        />
        <div className="relative z-10 mx-auto grid w-full max-w-[1120px] flex-1 items-center gap-10 px-4 pb-[17vh] sm:px-6 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-footnote font-semibold text-white/85 ring-1 ring-white/15">
              <span className="size-2 rounded-full bg-sun motion-safe:animate-pulse" aria-hidden />
              {offSeason ? "Rolling 30-day resets" : "No Nut November · 1–30 November"}
            </p>
            <h1
              id="hero-title"
              className="mt-5 text-[clamp(3rem,8.5vw,7rem)] leading-[0.95] font-extrabold tracking-[-0.035em] text-balance"
            >
              {offSeason ? (
                "Thirty days. Starting tonight."
              ) : (
                <>
                  Make it to <span className="landing-dawn-text">December.</span>
                </>
              )}
            </h1>
            <p className="mt-6 max-w-[34ch] text-[clamp(1.125rem,2vw,1.375rem)] leading-relaxed text-white/80">
              A streak clock that counts every second, a three-minute game for when the urge hits, and a private
              leaderboard with the friends you trust.
            </p>
            <div className="mt-8">
              <HeroClock />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CtaButton big />
              <a
                href="#ride"
                className="pressable inline-flex h-14 items-center gap-2 rounded-full px-5 text-headline text-white ring-1 ring-white/25 hover:bg-white/10"
              >
                <Waves size={20} weight="bold" aria-hidden /> Try riding a wave
              </a>
            </div>
            <p className="mt-4 text-footnote text-white/60">
              Free. 18+ only. Installs from your browser, no app store.
            </p>
          </div>
          <div className="relative hidden md:block">
            <div aria-hidden className="absolute inset-[-12%] -z-10 rounded-full bg-harbor/30 blur-3xl" />
            <HeroPhone />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-0 h-[24vh] min-h-40">
          <Ocean className="h-full w-full" />
        </div>
        <p className="absolute inset-x-0 bottom-4 z-10 text-center text-footnote text-white/55">
          Move across the water.
        </p>
      </section>

      {/* ---------------------------------------------------------- Ticker */}
      <section aria-label="Moments in WillWar" className="relative -mt-px overflow-hidden bg-night py-5">
        <div className="landing-marquee flex w-max gap-3">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span
              key={i}
              aria-hidden={i >= TICKER.length}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-subhead font-semibold text-white ${t.tint}`}
            >
              {t.icon}
              {t.text}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- 30 days (signature) */}
      <section id="thirty" aria-label="Scroll through your 30 days" className="relative">
        <ThirtyDays />
      </section>

      {/* ---------------------------------------------------------- Ride it out */}
      <section id="ride" className="relative py-24 sm:py-32" aria-labelledby="ride-title">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow tone="text-glacier">The three-minute game</Eyebrow>
            <h2 id="ride-title" className="mt-3 text-h2 font-extrabold tracking-tight">
              Urges crest. Then they fall.
            </h2>
            <p className="mt-5 max-w-[52ch] text-landing-body text-white/80">
              Tap <strong className="text-white">Ride it out</strong> and play a three-minute visual puzzle. In a
              week-long study at the University of Plymouth, three minutes of a block puzzle made cravings noticeably
              weaker, for food and drink as well as activities like sex.
            </p>
            <a
              href="https://pearl.plymouth.ac.uk/handle/10026.1/3458?show=full"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-footnote text-white/60 underline-offset-4 hover:underline"
            >
              Skorka-Brown et al., Addictive Behaviors, 2015 <ArrowSquareOut size={14} aria-hidden />
            </a>
            <div className="mt-8">
              <GameChips />
            </div>
          </div>
          <RideDemo />
        </div>
      </section>

      {/* ---------------------------------------------------------- Pacts */}
      <section id="pacts" className="relative py-24 sm:py-32" aria-labelledby="pacts-title">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow tone="text-sun">Quiet accountability</Eyebrow>
            <h2 id="pacts-title" className="mt-3 text-h2 font-extrabold tracking-tight">
              Bring the friends who&apos;ll actually check.
            </h2>
            <p className="mt-5 max-w-[46ch] text-landing-body text-white/80">
              Handles, not names. Your pact sees your number, never the reason it reset. Tap a wave to nudge someone who
              needs it.
            </p>
          </div>
          <PactBoard />
        </div>
      </section>

      {/* ---------------------------------------------------------- War Chest */}
      <section id="war-chest" className="relative py-24 sm:py-32" aria-labelledby="chest-title">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="lg:order-2">
            <Eyebrow tone="text-sun">Optional</Eyebrow>
            <h2 id="chest-title" className="mt-3 text-h2 font-extrabold tracking-tight">
              Put something on it.
            </h2>
            <p className="mt-5 max-w-[50ch] text-landing-body text-white/80">
              Pick an amount and a cause you care about. Each reset sends a quarter of it to that cause. Make it to the
              end, and whatever&apos;s left comes back to you.{" "}
              <strong className="text-white">WillWar never keeps any of it.</strong>
            </p>
            <p className="mt-5 max-w-[52ch] rounded-2xl bg-white/[0.06] p-4 text-footnote text-white/70 ring-1 ring-white/10">
              In a field study, smokers offered a contract like this, with their own money returned on success and given
              to charity otherwise, were more likely to quit. Giné, Karlan and Zinman, American Economic Journal:
              Applied Economics, 2010.
            </p>
            <p className="mt-3 text-footnote text-white/55">
              Optional. Free to skip. Honor system: nobody checks but you.
            </p>
          </div>
          <div className="lg:order-1">
            <WarChestDemo />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Morning line */}
      <section className="relative py-24 sm:py-32" aria-labelledby="tone-title">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="max-w-[680px]">
            <Eyebrow tone="text-sun">Every morning</Eyebrow>
            <h2 id="tone-title" className="mt-3 text-h2 font-extrabold tracking-tight">
              One line every morning, written for your day.
            </h2>
            <p className="mt-5 text-landing-body text-white/80">
              Pick the voice that actually steadies you. Change it any time.
            </p>
          </div>
          <div className="mt-10">
            <ToneCards />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Privacy */}
      <section className="relative py-24 sm:py-32" aria-labelledby="privacy-title">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <h2 id="privacy-title" className="text-h2 font-extrabold tracking-tight">
            Your streak is yours.
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: <IdentificationBadge size={26} aria-hidden />,
                text: "We never ask for your real name.",
                tint: "text-harbor-bright",
              },
              {
                icon: <DeviceMobile size={26} aria-hidden />,
                text: "Your journal stays on your phone.",
                tint: "text-glacier",
              },
              {
                icon: <EyeSlash size={26} aria-hidden />,
                text: "Ads here never use what you do in the app.",
                tint: "text-sun",
              },
              { icon: <Trash size={26} aria-hidden />, text: "Delete everything in one tap.", tint: "text-dawn" },
            ].map((p) => (
              <div
                key={p.text}
                className="flex items-center gap-4 rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ${p.tint}`}>
                  {p.icon}
                </span>
                <p className="text-[1.1875rem] font-semibold">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-footnote text-white/60">
            <BellSimpleSlash size={16} aria-hidden /> Notifications read &ldquo;WillWar · Day 12. Tap to check
            in.&rdquo; Never more.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- Learn */}
      <section id="evidence" className="relative py-24 sm:py-32" aria-labelledby="learn-title">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="max-w-[680px]">
            <Eyebrow tone="text-harbor-bright">Learn</Eyebrow>
            <h2 id="learn-title" className="mt-3 text-h2 font-extrabold tracking-tight">
              Straight answers, graded.
            </h2>
            <p className="mt-5 text-landing-body text-white/80">
              Every article shows how strong the evidence is. When the internet says one thing and the research says
              another, we show you both.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {featured.map((a) => {
              // Unreviewed drafts aren't published in production; show them without a link.
              const live = getArticle(a.slug) !== null;
              const cls = "group flex flex-col rounded-[24px] bg-white/[0.06] p-6 ring-1 ring-white/10";
              const Card = ({ children }: { children: ReactNode }) =>
                live ? (
                  <Link href={`/learn/${a.slug}`} className={`pressable ${cls} hover:bg-white/[0.1]`}>
                    {children}
                  </Link>
                ) : (
                  <div className={cls}>{children}</div>
                );
              return (
                <Card key={a.slug}>
                  <span
                    className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-footnote font-semibold ${
                      a.evidence === "myth"
                        ? "bg-white/10 text-white/80 ring-1 ring-white/25"
                        : "bg-harbor/60 text-white"
                    }`}
                  >
                    {a.evidence === "myth" && <Prohibit size={12} aria-hidden />}
                    Evidence: {GRADE_LABEL[a.evidence]}
                  </span>
                  <h3 className="mt-4 text-[1.1875rem] leading-snug font-semibold">{a.title}</h3>
                  <p className="mt-2 flex-1 text-subhead text-white/65">{a.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-subhead font-semibold text-harbor-bright">
                    <BookOpenText size={16} aria-hidden /> {live ? `Read, ${a.readMinutes} min` : "In review"}
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Pricing */}
      <section id="pricing" className="relative py-24 sm:py-32" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <h2 id="pricing-title" className="text-h2 font-extrabold tracking-tight">
            Free to hold the line.
          </h2>
          <p className="mt-4 max-w-[52ch] text-landing-body text-white/80">
            Everything that keeps you safe is free. Pro adds more tools and no ads.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-[28px] bg-white/[0.06] p-7 ring-1 ring-white/12">
              <p className="text-headline">Free</p>
              <p className="num mt-2 text-[2.75rem] font-semibold">₹0</p>
              <ul className="mt-6 grid flex-1 gap-3 text-body text-white/85">
                {[
                  "Streak clock and daily check-in",
                  "A morning line every day",
                  "Drift and Swell urge games",
                  "One pact of up to five friends",
                  "Every article",
                  "Includes non-personalized ads",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check size={20} className="mt-0.5 shrink-0 text-harbor-bright" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/app/start"
                className="pressable mt-8 flex h-13 items-center justify-center rounded-full bg-white/12 text-headline font-semibold ring-1 ring-white/25 hover:bg-white/20"
              >
                Start free
              </Link>
            </div>
            <div className="landing-pro-border relative flex flex-col rounded-[28px] p-[2px]">
              <div className="flex flex-1 flex-col rounded-[26px] bg-night-2 p-7">
                <div className="flex items-center justify-between">
                  <p className="text-headline">Pro</p>
                  <span className="rounded-full bg-sun px-2.5 py-1 text-footnote font-semibold text-night">
                    Best for the long stretch
                  </span>
                </div>
                <p className="mt-2">
                  <span className="num text-[2.75rem] font-semibold">₹{season}</span>
                  <span className="ml-2 text-subhead text-white/65">season pass, or ₹{annual} a year</span>
                </p>
                <ul className="mt-6 grid flex-1 gap-3 text-body text-white/85">
                  {[
                    "Everything in Free",
                    "All three games, including Knots",
                    "A coach to talk you through urges",
                    "Unlimited pacts up to 50 people",
                    "Custom challenges and trigger insights",
                    "Two streak shields a month",
                    "Encrypted journal backup and tide themes",
                    "No ads",
                  ].map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check size={20} className="mt-0.5 shrink-0 text-sun" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app/start"
                  className="pressable mt-8 flex h-13 items-center justify-center rounded-full bg-linear-to-r from-dawn to-sun text-headline font-semibold text-night"
                >
                  Get Pro
                </Link>
              </div>
            </div>
          </div>
          <p className="mt-5 text-footnote text-white/60">
            Prices include taxes. Cancel anytime in Settings. The War Chest is separate, optional and available on Free
            and Pro.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- Questions */}
      <section className="relative py-24 sm:py-32" aria-labelledby="faq-title">
        <div className="mx-auto max-w-[760px] px-4 sm:px-6">
          <h2 id="faq-title" className="text-h2 font-extrabold tracking-tight">
            Questions.
          </h2>
          <div className="mt-8 grid gap-2.5">
            {[
              ["Is WillWar for under-18s?", "No. WillWar is for adults only."],
              ["Does it work on iPhone?", "Yes. Open the site in Safari, tap Share, then Add to Home Screen."],
              [
                "What happens if I slip?",
                "Tap Reset streak. Your best streak stays on your record, and there are no lectures.",
              ],
              [
                "Will my friends see why I reset?",
                "No. Your pact sees your current number. Never the reason, the time, or any notes.",
              ],
              ["Does it work offline?", "Your clock keeps running offline. Check-ins sync when you're back."],
              [
                "Is this medical advice?",
                "No. If urges or habits are hurting your life, talk to a doctor or counselor.",
              ],
              [
                "What's the War Chest?",
                "An optional amount you put behind your pledge. Each reset sends a quarter to the cause you chose; the rest comes back to you when your challenge ends. We never keep any of it, and we only ask once.",
              ],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-[20px] bg-white/[0.06] ring-1 ring-white/10 open:bg-white/[0.09]"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 text-[1.0625rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-sun transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-body text-white/75">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- Dawn: final CTA */}
      <section className="relative isolate overflow-hidden pt-28 pb-0 text-center" aria-labelledby="cta-title">
        <div
          aria-hidden
          className="landing-sun pointer-events-none absolute bottom-[22%] left-1/2 -z-10 size-[min(70vw,520px)] -translate-x-1/2 rounded-full"
        />
        <div className="mx-auto max-w-[760px] px-4 pb-40 sm:px-6">
          <span className="mx-auto inline-flex rounded-2xl bg-white/15 p-2 ring-1 ring-white/25">
            <Mark size={40} tile />
          </span>
          <h2
            id="cta-title"
            className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-tight text-balance"
          >
            The clock starts when you say it does.
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-landing-body text-white/85">
            No app store. Add it to your home screen in ten seconds, and keep everything on your phone.
          </p>
          <div className="mt-9">
            <CtaButton big />
          </div>
          <p className="mt-4 text-footnote text-white/70">Free. 18+ only.</p>
        </div>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-24 w-full" aria-hidden>
          <path d="M0 60 C 240 20, 480 100, 720 60 S 1200 20, 1440 60 V120 H0 Z" className="fill-night" />
        </svg>
      </section>

      {/* ---------------------------------------------------------- Footer */}
      <footer className="bg-night pt-14 pb-28 sm:pb-12">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 text-headline font-semibold">
              <Mark size={28} tile /> WillWar
            </span>
            <p className="mt-3 max-w-[30ch] text-subhead text-white/60">A 30-day streak tracker for adults.</p>
          </div>
          <FooterCol
            title="Product"
            links={[
              ["Today", "/app/today"],
              ["Pacts", "#pacts"],
              ["Learn", "#evidence"],
              ["Pricing", "#pricing"],
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              ["Install on iPhone", "/support#install"],
              ["Get support", "/support"],
              ["Contact", "/support#contact"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
              ["Health disclaimer", "/health"],
            ]}
          />
        </div>
        <div className="mx-auto mt-12 flex max-w-[1120px] flex-wrap justify-between gap-3 border-t border-white/10 px-4 pt-6 text-footnote text-white/50 sm:px-6">
          <span>18+ only. Not medical advice.</span>
          <span>© {2026} WillWar</span>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-subhead font-semibold">{title}</p>
      <ul className="mt-3 grid gap-2 text-subhead text-white/60">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
