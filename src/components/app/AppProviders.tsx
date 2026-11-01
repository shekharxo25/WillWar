"use client";

import type { ReactNode } from "react";
import { HudProvider } from "@/components/ui/Hud";
import { WillWarProvider } from "@/lib/store/provider";
import { AppChrome } from "./AppChrome";
import { ServiceWorker } from "./ServiceWorker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WillWarProvider>
      <HudProvider>
        <ServiceWorker />
        <AppChrome>{children}</AppChrome>
      </HudProvider>
    </WillWarProvider>
  );
}
