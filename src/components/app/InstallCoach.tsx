"use client";

import { DeviceMobile, Export, PlusSquare, SquaresFour } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Cell, InsetGroup } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { isStandalone } from "./ServiceWorker";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios-safari" | "ios-other" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "ios-other" : "ios-safari";
  if (/Android/.test(ua)) return "android";
  return "other";
}

let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
}

const DISMISS_KEY = "ww-install-dismissed";

/** Whether to show the install coach: not installed, and not dismissed in the last 3 days. */
function shouldShowCoach(): boolean {
  if (typeof window === "undefined" || isStandalone()) return false;
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at > 3 * 86_400_000;
  } catch {
    return true;
  }
}

// Rendered only on the client (behind Gate/ClientOnly), so lazy state can read the browser.
export function useInstallCoach() {
  const [show, setShow] = useState(shouldShowCoach);
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShow(false);
  };
  return { show, dismiss };
}

export function InstallSteps({ onDone }: { onDone?: () => void }) {
  const [platform] = useState<Platform>(() => (typeof navigator === "undefined" ? "other" : detectPlatform()));

  if (platform === "android" || (platform === "other" && deferred)) {
    return (
      <div className="grid gap-3">
        <p className="text-body text-label-2">Installed, WillWar can remind you each day and works offline.</p>
        <Button
          full
          onClick={async () => {
            if (!deferred) return onDone?.();
            await deferred.prompt();
            await deferred.userChoice;
            deferred = null;
            onDone?.();
          }}
        >
          Install WillWar
        </Button>
      </div>
    );
  }
  if (platform === "ios-other") {
    return (
      <p className="text-body text-label-2">
        To install WillWar, open this page in Safari, then add it to your Home Screen from the Share menu.
      </p>
    );
  }
  if (platform === "ios-safari") {
    return (
      <div className="grid gap-3">
        <p className="text-body text-label-2">Installed, WillWar can remind you each day and works offline.</p>
        <InsetGroup>
          <Cell icon={<Export size={18} aria-hidden />} title="Tap Share" subtitle="The square with an arrow, at the bottom" chevron={false} />
          <Cell icon={<PlusSquare size={18} aria-hidden />} title="Tap Add to Home Screen" subtitle="Scroll down the list if you don't see it" chevron={false} />
          <Cell icon={<SquaresFour size={18} aria-hidden />} title="Open WillWar from your Home Screen" chevron={false} />
        </InsetGroup>
      </div>
    );
  }
  return (
    <p className="text-body text-label-2">
      On your phone, open this site in Safari (iPhone) or Chrome (Android) and add it to your Home Screen. Installed,
      WillWar works offline.
    </p>
  );
}

export function InstallCell() {
  const { show, dismiss } = useInstallCoach();
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <>
      <InsetGroup>
        <Cell icon={<DeviceMobile size={18} aria-hidden />} title="Install WillWar" subtitle="Works offline, opens like an app" onClick={() => setOpen(true)} />
      </InsetGroup>
      <Sheet open={open} onOpenChange={setOpen} title="Add WillWar to your Home Screen">
        <InstallSteps onDone={() => setOpen(false)} />
        <div className="mt-4 grid gap-2">
          <Button variant="secondary" full onClick={() => setOpen(false)}>
            I&apos;ve added it
          </Button>
          <Button
            variant="plain"
            full
            onClick={() => {
              dismiss();
              setOpen(false);
            }}
          >
            Not now
          </Button>
        </div>
      </Sheet>
    </>
  );
}
