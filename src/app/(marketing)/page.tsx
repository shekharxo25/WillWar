import Link from "next/link";
import { DeviceMobile, EyeSlash, IdentificationCard, Trash } from "@phosphor-icons/react/dist/ssr";
import { Header } from "@/components/landing/Header";
import { LiveLed } from "@/components/landing/LiveLed";
import { ChalkScroll } from "@/components/landing/ChalkScroll";
import { HoldDemo } from "@/components/landing/HoldDemo";
import { CampBoardMock } from "@/components/landing/CampBoardMock";
import { WarChestCardMock } from "@/components/landing/WarChestCardMock";
import { Faq } from "@/components/landing/Faq";
import { PledgeList } from "@/components/landing/PledgeList";
import { Poster } from "@/components/poster/Poster";
import { EvidenceChip, type Evidence } from "@/components/ui/EvidenceChip";
import { FocusMitt, HeavyBag, KitbagIcon } from "@/components/illustrations";
import { FREE_FEATURES, PLANS, PRO_FEATURES } from "@/lib/config/plans";
import { SEASON_MODE } from "@/lib/config/season";
import { warChestMode } from "@/lib/config/flags";

const cta =
  "press inline-flex h-[52px] items-center justify-center rounded-button px-6 text-[17px] leading-[22px] font-semibold";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="l-h2 l-col">
      {children}
    </h2>
  );
}

const TONES = [
  { tone: "Steady", line: "Day 9. You've handled nine evenings like this one. Handle tonight the same way." },
  { tone: "Stoic", line: "Day 9. The urge wants your attention. Give it three minutes and nothing more." },
  { tone: "Coach", line: "Day 9. Phone out of the bedroom tonight. That's the game plan." },
  { tone: "Playful", line: "Day 9. One more and you're in double digits. Don't stop at the bell." },
];

const PRIVACY = [
  { Icon: IdentificationCard, text: "We never ask for your real name." },
  { Icon: DeviceMobile, text: "Your journal stays on your phone." },
  { Icon: EyeSlash, text: "Ads here never use what you do in the app." },
  { Icon: Trash, text: "Delete everything in one tap." },
];

const ARTICLES: { grade: Evidence; title: string; slug: string }[] = [
  { grade: "myth", title: "The day-7 testosterone claim, traced to its source", slug: "day-7-testosterone-claim" },
  { grade: "moderate", title: "Why one slip turns into a week, and how to stop it", slug: "one-slip-turns-into-a-week" },
  { grade: "moderate", title: "Three minutes of a puzzle versus a craving", slug: "three-minutes-of-a-puzzle" },
];

const GAMES = [
  { Icon: KitbagIcon, name: "Kitbag", line: "Pack the bag.", tier: "Free" },
  { Icon: HeavyBag, name: "Bag", line: "Breathe with the bag.", tier: "Free" },
  { Icon: FocusMitt, name: "Combos", line: "Hit the pads.", tier: "Pro" },
];

export default function Landing() {
  const promise = warChestMode() !== "stake";
  const dateLine = SEASON_MODE === "rolling" ? "30 days. Starting tonight." : "30 days. 1–30 November. Your phone.";
  return (
    <>
      <Header />
      <main>
        {/* 2. Hero: the poster */}
        <section className="l-wrap pt-8 md:pt-14" aria-label="WillWar">
          <Poster
            dateLine={dateLine}
            aside={
              <div className="mt-8 lg:mt-6">
                <LiveLed />
                <p className="mt-3 text-[15px] leading-5">Your clock started when you opened this page.</p>
              </div>
            }
          >
            <div className="mt-8 flex flex-col items-start gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:gap-5">
              <Link id="hero-cta" href="/app/start" className={`${cta} bg-ink text-[var(--knob)]`}>
                Start my 30 days
              </Link>
              <p className="text-[15px] leading-5">Free. 18+ only. Installs from your browser.</p>
            </div>
          </Poster>
        </section>

        {/* 3. Thirty days, chalked */}
        <ChalkScroll />

        {/* 4. Go a round */}
        <section className="l-section l-wrap" aria-labelledby="round-h">
          <H2 id="round-h">An urge is a round. Last three minutes.</H2>
          <p className="l-lead l-col mt-6 text-text-2">
            Tap Go a round and play a three-minute visual puzzle, the length of a pro boxing round. In a week-long study at
            the University of Plymouth, three minutes of a block puzzle made cravings noticeably weaker, for food and drink
            as well as activities like sex.
          </p>
          <HoldDemo />
          <p className="mt-4 text-[13px] leading-[18px] text-text-2">Skorka-Brown et al., Addictive Behaviors, 2015.</p>
          <ul className="mt-12 grid gap-8 sm:grid-cols-3">
            {GAMES.map(({ Icon, name, line, tier }) => (
              <li key={name} className="border-t-[0.5px] border-[var(--hairline)] pt-5">
                <Icon size={48} className="text-text-2" />
                <p className="display mt-3 text-[34px] leading-[34px]">{name}</p>
                <p className="l-body text-text-2">
                  {line} {tier === "Pro" ? "Pro." : "Free."}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Camps */}
        <section id="camps" className="l-section l-wrap grid items-start gap-10 md:grid-cols-2" aria-labelledby="camps-h">
          <div>
            <H2 id="camps-h">Train with the friends who&apos;ll actually check.</H2>
            <p className="l-lead mt-6 text-text-2">
              Handles, not names. Your camp sees your number, never the reason it reset.
            </p>
          </div>
          <CampBoardMock />
        </section>

        {/* 6. War Chest */}
        <section className="l-section l-wrap grid items-start gap-10 md:grid-cols-2" aria-labelledby="chest-h">
          <div>
            <H2 id="chest-h">Put something on it.</H2>
            <p className="l-lead mt-6 text-text-2">
              Pick an amount and a cause you care about. Each reset sends a quarter of it to that cause. Make it to the end,
              and whatever&apos;s left comes back to you. WillWar never keeps any of it.
            </p>
            {promise && (
              <p className="l-body mt-4">Name an amount and a cause. If you reset, you donate your share yourself.</p>
            )}
            <p className="mt-6 text-[13px] leading-[18px] text-text-2">
              In a field study, smokers offered a contract like this, with their own money returned on success and given to
              charity otherwise, were more likely to quit. Giné, Karlan and Zinman, 2010.
            </p>
            <p className="mt-3 text-[13px] leading-[18px] text-text-2">Optional. Free to skip. Honor system: nobody checks but you.</p>
          </div>
          <WarChestCardMock />
        </section>

        {/* 7. Corner talk */}
        <section className="l-section l-wrap" aria-labelledby="corner-h">
          <H2 id="corner-h">A word from your corner, every morning.</H2>
          <dl className="mt-10 grid gap-x-10 md:grid-cols-2">
            {TONES.map((t) => (
              <div key={t.tone} className="border-t-[0.5px] border-[var(--hairline)] py-6">
                <dt className="text-[15px] leading-5 text-text-2">{t.tone}</dt>
                <dd className="mt-2 text-[22px] leading-[30px]">{t.line}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 8. Privacy */}
        <section className="l-section l-wrap" aria-labelledby="privacy-h">
          <H2 id="privacy-h">Your record is yours.</H2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {PRIVACY.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <Icon size={28} weight="bold" className="mt-0.5 shrink-0 text-text-2" aria-hidden />
                <span className="l-lead">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 9. Learn */}
        <section className="l-section l-wrap" aria-labelledby="learn-h">
          <H2 id="learn-h">Straight answers. Graded.</H2>
          <p className="l-lead l-col mt-6 text-text-2">
            Every article shows how strong the evidence is. When the internet says one thing and the research says another,
            we show you both.
          </p>
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {ARTICLES.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`} className="press block h-full rounded-card bg-raised p-5">
                  <EvidenceChip grade={a.grade} />
                  <p className="mt-4 text-[17px] leading-[22px] font-semibold">{a.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 10. Pricing */}
        <section id="pricing" className="l-section l-wrap" aria-labelledby="pricing-h">
          <H2 id="pricing-h">Free, or Pro.</H2>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            <div className="rounded-card bg-raised p-6">
              <p className="display text-[40px] leading-[40px]">FREE</p>
              <ul className="l-body mt-4 text-text-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/app/start" className={`${cta} mt-6 w-full bg-primary text-on-primary`}>
                Start free
              </Link>
            </div>
            <div className="rounded-card bg-raised p-6">
              <p className="display text-[40px] leading-[40px]">PRO</p>
              <p className="mt-4 text-[15px] leading-5 text-text-2">Everything in Free, and adds:</p>
              <ul className="l-body mt-1 text-text-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[PLANS.season, PLANS.annual].map((p) => (
                  <div key={p.id}>
                    <dt className="text-[15px] leading-5 text-text-2">{p.name}</dt>
                    <dd className="display text-[34px] leading-[38px]">₹{p.inr}</dd>
                    <dd className="text-[13px] leading-[18px] text-text-2">${p.usd}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/app/pro" className={`${cta} mt-6 w-full bg-primary text-on-primary`}>
                Get Pro
              </Link>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-[18px] text-text-2">
            Prices include taxes. Cancel anytime in Settings. The War Chest is separate, optional, and available on Free and
            Pro.
          </p>
        </section>

        {/* 11. Questions */}
        <section id="faq" className="l-section l-wrap" aria-labelledby="faq-h">
          <H2 id="faq-h">Questions.</H2>
          <div className="l-col mt-10">
            <Faq />
          </div>
        </section>

        {/* Pledge list */}
        <section className="l-section l-wrap" aria-labelledby="list-h">
          <h2 id="list-h" className="text-[22px] leading-[28px] font-semibold">
            Not starting tonight?
          </h2>
          <p className="l-body mt-2 text-text-2">Leave an email. We&apos;ll send one note when the next season opens.</p>
          <PledgeList />
        </section>
      </main>
    </>
  );
}
