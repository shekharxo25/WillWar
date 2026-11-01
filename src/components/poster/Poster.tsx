import { LetterpressFilter } from "./LetterpressFilter";
import { TapeStrip } from "./TapeStrip";

/**
 * The fight poster, taped to the concrete wall. Real billing order: presenter, top
 * billing, "vs.", the opponent, then the date line. The letterpress edge is the only
 * texture and is used only on the two headline names.
 * On wide screens the date line and live clock (`aside`) sit beside the top billing.
 */
export function Poster({ dateLine, aside, children }: { dateLine: string; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[1040px]">
      <LetterpressFilter />
      <TapeStrip className="-left-3 -top-3 -rotate-[8deg]" />
      <TapeStrip className="-right-3 -top-3 rotate-[7deg]" />
      <div className="poster-paper relative rounded-plate px-5 pb-8 pt-10 shadow-[0_0_0_0.5px_var(--hairline)] min-[480px]:px-10 min-[480px]:pt-12 lg:px-16">
        <p className="text-[15px] leading-5">WillWar presents</p>
        <h1 className="mt-3">
          <span className="block lg:flex lg:items-end lg:gap-6">
            <span className="poster-name display block" style={{ filter: "url(#letterpress)" }}>
              YOU
            </span>
            <span className="block py-1 font-display text-[clamp(28px,4vw,48px)] leading-none lg:pb-4">vs.</span>
          </span>
          <span className="poster-name display block" style={{ filter: "url(#letterpress)" }}>
            THE URGE
          </span>
        </h1>
        <div className="lg:absolute lg:right-16 lg:top-[136px] lg:w-[360px]">
          <p className="mt-5 text-[20px] leading-[30px] lg:mt-0">{dateLine}</p>
          {aside}
        </div>
        {children}
      </div>
    </div>
  );
}
