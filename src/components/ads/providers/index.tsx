"use client";
/**
 * Ad providers. House ads are the default (ADS_MODE=house). AdSense and the H5 Games Ads beta
 * both need Google approval; until NEXT_PUBLIC_ADS_MODE matches AND NEXT_PUBLIC_ADSENSE_CLIENT
 * is set, these render house ads. AdSlot only mounts them on allowlisted routes, so Google
 * scripts never load anywhere else.
 */
import { useEffect } from "react";
import { adsMode } from "@/lib/config/flags";
import { sponsorFor } from "@/lib/config/sponsors";
import { HouseAd } from "../HouseAd";

const client = () => process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export function adsenseEnabled() {
  return adsMode() === "adsense" && !!client();
}
export function h5Enabled() {
  return adsMode() === "h5" && !!client();
}

function useGoogleScript(enabled: boolean) {
  useEffect(() => {
    if (!enabled || document.querySelector("script[data-ww-adsense]")) return;
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.dataset.wwAdsense = "1";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client())}`;
    document.head.appendChild(s);
  }, [enabled]);
}

/** In-feed / in-article display unit. Non-personalized (requestNonPersonalizedAds). */
export function DisplayAd({ slotKey }: { slotKey: string }) {
  const enabled = adsenseEnabled();
  useGoogleScript(enabled);
  useEffect(() => {
    if (!enabled) return;
    const w = window as unknown as { adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number } };
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.requestNonPersonalizedAds = 1;
    w.adsbygoogle.push({});
  }, [enabled]);
  if (!enabled) return <HouseAd sponsor={sponsorFor(slotKey)} />;
  return (
    <aside aria-label="Sponsored" className="rounded-card border border-dashed border-[var(--hairline)] p-3">
      <p className="mb-2 text-[13px] leading-[18px] text-text-2">Sponsored</p>
      <ins className="adsbygoogle block" data-ad-client={client()} data-ad-format="fluid" data-npa="1" />
    </aside>
  );
}
