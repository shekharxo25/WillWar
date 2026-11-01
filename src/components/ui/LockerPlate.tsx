import { lockerNumber } from "@/lib/time";
/** Avatar: 36px square, radius 4, tape fill, seeded two-digit number. No photos anywhere. */
export function LockerPlate({ seed, size = 36 }: { seed: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="display inline-flex shrink-0 items-center justify-center rounded-[4px] bg-primary text-on-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.61), lineHeight: 1 }}
    >
      {lockerNumber(seed)}
    </span>
  );
}
