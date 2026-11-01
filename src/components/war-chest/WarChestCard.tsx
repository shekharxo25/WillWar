import { Vault } from "@phosphor-icons/react/dist/ssr";
import { formatMoney } from "@/lib/config/causes";
import { shortDate, addDays } from "@/lib/time";

/** Amount in League Gothic 40; split bar: still yours in --text, given part hatched. Never red, never "lost". */
export function WarChestCard({ amountMinor, forfeitedMinor, currency, causeName, endsOn }: { amountMinor: number; forfeitedMinor: number; currency: "INR" | "USD"; causeName: string; endsOn: string | null }) {
  const yours = amountMinor - forfeitedMinor;
  const pct = amountMinor ? (yours / amountMinor) * 100 : 0;
  return (
    <div className="rounded-card bg-raised p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] leading-[18px] text-text-2">War Chest</span>
        <Vault size={22} weight="bold" className="text-text-2" aria-hidden />
      </div>
      <div className="display mt-1 text-[40px] leading-[40px]">{formatMoney(amountMinor, currency)}</div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-[3px]" role="img" aria-label={`${formatMoney(yours, currency)} still yours, ${formatMoney(forfeitedMinor, currency)} given to ${causeName}`}>
        <span className="bg-primary" style={{ width: `${pct}%` }} />
        <span className="hatch flex-1" />
      </div>
      <div className="mt-2 flex justify-between text-[13px] leading-[18px]">
        <span>{formatMoney(yours, currency)} still yours</span>
        <span className="text-text-2">{formatMoney(forfeitedMinor, currency)} given</span>
      </div>
      {endsOn && <p className="mt-3 text-[15px] leading-5 text-text-2">Comes back on {shortDate(addDays(endsOn, 1))}. Cause: {causeName}.</p>}
    </div>
  );
}
