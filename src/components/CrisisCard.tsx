import { CRISIS_CARD_COPY, resourcesFor } from "@/lib/config/crisis-resources";

/** Static crisis card. Numbers come from config, never from the model (Part 8.4). */
export function CrisisCard({ country, under18 = false, stakeActive = false }: { country?: string | null; under18?: boolean; stakeActive?: boolean }) {
  return (
    <div className="rounded-card bg-raised p-5" role="alert">
      <p className="text-[17px] leading-[22px]">{CRISIS_CARD_COPY}</p>
      <ul className="mt-4 space-y-1">
        {resourcesFor(country).map((r) => (
          <li key={r.label + r.detail}>
            {r.href ? (
              <a href={r.href} className="press flex min-h-[44px] flex-col justify-center" target={r.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                <span className="text-[17px] leading-[22px] font-semibold underline underline-offset-4">{r.detail}</span>
                <span className="text-[15px] leading-5 text-text-2">{r.region}: {r.label}</span>
              </a>
            ) : (
              <span className="flex min-h-[44px] flex-col justify-center">
                <span className="text-[17px] leading-[22px] font-semibold">{r.label}</span>
                <span className="text-[15px] leading-5 text-text-2">{r.region}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {stakeActive && <p className="mt-4 text-[15px] leading-5">Your War Chest can wait. Want your money back now? <a className="underline" href="/support">Contact support</a>.</p>}
      {under18 && <p className="mt-4 text-[15px] leading-5 font-semibold">WillWar is for adults. Your account will be closed.</p>}
    </div>
  );
}
