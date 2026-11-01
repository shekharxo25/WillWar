import { Plus } from "@phosphor-icons/react/dist/ssr";

const QA: { q: string; a: string }[] = [
  { q: "Is WillWar for under-18s?", a: "No. WillWar is for adults only." },
  { q: "Does it work on iPhone?", a: "Yes. Open it in Safari, tap Share, then Add to Home Screen." },
  { q: "What happens if I slip?", a: "Tap Reset streak. Your best streak and your tally stay on the wall. No lectures." },
  { q: "Will my camp see why I reset?", a: "No. They see your number, never the reason, the time or any notes." },
  { q: "Does it work offline?", a: "The clock runs offline. Check-ins sync when you're back." },
  { q: "Is this medical advice?", a: "No. If urges or habits are hurting your life, talk to a doctor or counselor." },
  {
    q: "What's the War Chest?",
    a: "An optional amount behind your pledge. Each reset sends a quarter of it to your cause, and the rest comes back when the challenge ends. We never keep any of it, and we only ask once.",
  },
];

/** Native disclosure so every answer is readable without JavaScript. */
export function Faq() {
  return (
    <div className="overflow-hidden rounded-card bg-raised">
      {QA.map((x, i) => (
        <details key={x.q} className={`group ${i ? "border-t-[0.5px] border-[var(--hairline)]" : ""}`}>
          <summary className="press flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-[17px] leading-[22px] font-semibold [&::-webkit-details-marker]:hidden">
            {x.q}
            <Plus size={18} weight="bold" aria-hidden className="shrink-0 text-text-2 transition-transform duration-[180ms] group-open:rotate-45" />
          </summary>
          <p className="l-body px-5 pb-5 text-text-2">{x.a}</p>
        </details>
      ))}
    </div>
  );
}
