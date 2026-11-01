"use client";

import { BookOpenText, SealCheck, User, Waves } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const TABS = [
  { href: "/app/today", label: "Today", Icon: Waves },
  { href: "/app/pact", label: "Pact", Icon: SealCheck },
  { href: "/app/learn", label: "Learn", Icon: BookOpenText },
  { href: "/app/me", label: "Me", Icon: User },
] as const;

/** Routes that show the floating tab bar. Ride it out, onboarding, sheets-as-pages stay chromeless. */
const TAB_ROUTES = ["/app/today", "/app/pact", "/app/learn", "/app/me", "/app/settings"];
/** The pill sits above the tab bar on Today, Pact and Learn (DESIGN.md section 4). */
const PILL_ROUTES = ["/app/today", "/app/pact", "/app/learn"];

const matches = (path: string, routes: string[]) => routes.some((r) => path === r || path.startsWith(`${r}/`));

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] overscroll-none bg-grouped">
      {children}
      {/* Pathname is request data: keep it behind Suspense so pages still prerender. */}
      <Suspense fallback={null}>
        <TabChrome />
      </Suspense>
    </div>
  );
}

function TabChrome() {
  const path = usePathname() ?? "";
  const showTabs = matches(path, TAB_ROUTES);
  const showPill = matches(path, PILL_ROUTES);
  const compact = useScrolledDown();
  if (!showTabs) return null;
  return (
    <>
      <div aria-hidden className="h-[calc(env(safe-area-inset-bottom)+150px)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
        {showPill && <RideItOutPill compact={compact} />}
        <nav aria-label="Main" className="glass pointer-events-auto grid h-16 grid-cols-4 rounded-full px-1.5">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href || path.startsWith(`${href}/`) || (href === "/app/me" && path.startsWith("/app/settings"));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`pressable flex flex-col items-center justify-center gap-0.5 text-tab font-medium ${active ? "text-tide" : "text-label-2"}`}
              >
                <Icon size={24} weight={active ? "fill" : "regular"} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

function RideItOutPill({ compact }: { compact: boolean }) {
  return (
    <div className="mb-3 flex justify-end">
      <Link
        href="/app/urge"
        aria-label="Ride it out"
        className={`pressable pointer-events-auto flex h-[52px] items-center justify-center gap-2 rounded-full bg-tide text-headline text-on-tide shadow-float transition-[width] duration-300 ease-[var(--ease-standard)] ${
          compact ? "w-[52px]" : "w-full"
        }`}
      >
        <Waves size={22} weight="bold" aria-hidden />
        {!compact && <span>Ride it out</span>}
      </Link>
    </div>
  );
}

/** True while the person scrolls down past the top (pill compresses to a circle). */
function useScrolledDown() {
  const [down, setDown] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setDown(y > 80 && y > last.current);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return down;
}

/** Large title (34pt) that collapses to a centred 17pt glass bar once content scrolls under it. */
export function LargeTitle({ title, trailing, leading }: { title: string; trailing?: ReactNode; leading?: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting), { rootMargin: "-44px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-30 mx-auto flex max-w-[480px] items-end justify-center pt-safe transition-opacity duration-200 ${
          collapsed ? "glass opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!collapsed}
      >
        <div className="flex h-11 items-center text-headline">{title}</div>
      </div>
      <header className="flex items-end justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-2">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <h1 className="truncate text-large-title font-bold">{title}</h1>
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-2 pb-1">{trailing}</div>}
      </header>
      <div ref={sentinel} aria-hidden className="h-px" />
    </>
  );
}

/** A 44×44 circular glass button holding a single icon. */
export function CircleButton({
  href,
  onClick,
  label,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  const cls = "pressable glass flex size-11 items-center justify-center rounded-full text-label";
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {children}
    </button>
  );
}

export function OfflineBanner() {
  return (
    <div role="status" className="mx-4 mb-3 rounded-cell bg-tertiary px-4 py-2.5 text-footnote text-label">
      Offline. Your clock keeps running; check-ins sync when you&apos;re back.
    </div>
  );
}
