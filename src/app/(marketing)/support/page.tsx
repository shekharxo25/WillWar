import type { Metadata } from "next";
import { StaticPage } from "@/components/landing/StaticPage";
import { CRISIS_RESOURCES } from "@/lib/config/crisis-resources";

export const metadata: Metadata = { title: "Support" };

export default function Support() {
  return (
    <StaticPage title="Support">
      <p>If you need to talk to someone now:</p>
      <ul className="!ml-0 space-y-1">
        {CRISIS_RESOURCES.map((r) => (
          <li key={r.label + r.detail} className="!ml-0 !list-none">
            {r.href ? (
              <a href={r.href} className="flex min-h-[44px] flex-col justify-center !no-underline">
                <span className="font-semibold underline underline-offset-4">
                  {r.region === "Elsewhere" ? r.detail : `${r.label}: ${r.detail}`}
                </span>
                <span className="text-[15px] leading-5 text-text-2">{r.region}</span>
              </a>
            ) : (
              <span className="flex min-h-[44px] flex-col justify-center">
                <span className="font-semibold">{r.label}</span>
                <span className="text-[15px] leading-5 text-text-2">{r.region}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <h2>Help with the app</h2>
      <p>
        Email <a href="mailto:hello@example.com">hello@example.com</a>. For a War Chest you need back early, say so and
        we&apos;ll return what&apos;s left. No questions.
      </p>
    </StaticPage>
  );
}
