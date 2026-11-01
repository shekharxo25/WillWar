// Pro plans (docs/BUILD_PLAN.md Phase 9). Prices come from env; displays say taxes included.
import { CURRENT_SEASON } from "@/lib/domain/constants";
import { goalEndInstant, localDate, MS_DAY } from "@/lib/time";

export type Plan = "season" | "annual";

/**
 * When a season pass ends: midnight after the season's last day in the person's timezone
 * while the season is running, otherwise 30 days from purchase (rolling resets).
 */
export function seasonPassEnd(now: Date, timezone: string): Date {
  if (localDate(now, timezone) <= CURRENT_SEASON.endsOn) return goalEndInstant(CURRENT_SEASON.endsOn, timezone);
  return new Date(now.getTime() + 30 * MS_DAY);
}
