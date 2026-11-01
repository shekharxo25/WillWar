"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Timer, UserCircle, UsersThree } from "@phosphor-icons/react";

const TABS = [
  { href: "/app/today", label: "Today", Icon: Timer },
  { href: "/app/camp", label: "Camp", Icon: UsersThree },
  { href: "/app/learn", label: "Learn", Icon: BookOpen },
  { href: "/app/me", label: "Me", Icon: UserCircle },
];

/** Floating smoked-glass capsule 16pt from the edges above the home indicator. */
export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 z-40 mx-auto max-w-[480px] px-4" style={{ bottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
      <ul className="glass flex h-[62px] items-stretch rounded-full px-2 shadow-[0_0_0_0.5px_var(--hairline)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/") || (href === "/app/me" && path.startsWith("/app/settings"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`press flex h-full flex-col items-center justify-center gap-0.5 ${active ? "text-text" : "text-text-3"}`}
              >
                <Icon size={26} weight={active ? "fill" : "bold"} aria-hidden />
                <span className="text-[11px] leading-[13px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
