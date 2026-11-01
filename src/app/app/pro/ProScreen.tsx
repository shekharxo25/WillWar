"use client";
import { useRouter } from "next/navigation";
import { useApp, useNow } from "@/components/AppProvider";
import { Paywall } from "@/components/pro/Paywall";
import { Screen } from "@/components/ui/Screen";
import { ButtonLink } from "@/components/ui/Button";
import { isPro } from "@/lib/store/engine";
import { PLANS } from "@/lib/config/plans";

export function ProScreen() {
  const { snap } = useApp();
  const now = useNow(60_000);
  const router = useRouter();
  const pro = !!snap && !!now && isPro(snap.entitlement, now);
  const back = () => (window.history.length > 1 ? router.back() : router.push("/app/today"));

  return (
    <Screen title="WILLWAR PRO" back="/app/me" bottomPad={false}>
      <div className="pb-[calc(env(safe-area-inset-bottom)+32px)]">
        {pro && snap?.entitlement ? (
          <div className="rounded-card bg-raised p-5">
            <p className="text-[17px] leading-[22px] font-semibold">You&apos;re on Pro.</p>
            <p className="mt-1 text-[15px] leading-5 text-text-2">
              {PLANS[snap.entitlement.plan].name}
              {snap.entitlement.currentPeriodEnd ? `, until ${new Date(snap.entitlement.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}.
            </p>
            <ButtonLink href="/app/today" className="mt-5">Back to Today</ButtonLink>
          </div>
        ) : (
          <Paywall source="feature" onContinueFree={back} onPro={() => router.replace("/app/today")} />
        )}
      </div>
    </Screen>
  );
}
