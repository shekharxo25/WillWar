import { Vault } from "@phosphor-icons/react/dist/ssr";

/** War Chest card: never red, never "lost". The part still yours in tape, the part given hatched. */
export function WarChestCardMock() {
  const total = 499;
  const given = 125;
  const yours = 375; // after one Steady reset: a quarter of ₹499, rounded for display
  return (
    <div className="w-full max-w-[420px] rounded-card bg-raised p-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] leading-5 text-text-2">War Chest</span>
        <Vault size={24} weight="bold" className="text-text-2" aria-hidden />
      </div>
      <p className="display mt-2 text-[40px] leading-[40px]">₹{total}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-[2px]" role="img" aria-label={`₹${yours} still yours, ₹${given} given`}>
        <span className="h-full bg-[var(--text)]" style={{ width: `${(yours / total) * 100}%` }} />
        <span className="hatch h-full flex-1" />
      </div>
      <div className="mt-2 flex justify-between text-[15px] leading-5">
        <span>₹375 still yours</span>
        <span className="text-text-2">₹125 given</span>
      </div>
      <p className="mt-4 text-[13px] leading-[18px] text-text-2">Comes back on Tue 1 Dec. Cause: the one you pick.</p>
    </div>
  );
}
