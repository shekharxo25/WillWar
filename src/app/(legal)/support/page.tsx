import type { Metadata } from "next";
import { CRISIS_RESOURCES } from "@/lib/config/crisis-resources";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <h1>Support</h1>
      <h2 id="now">Talk to someone now</h2>
      <ul>
        {CRISIS_RESOURCES.map((r) => (
          <li key={r.id}>
            {r.name}: {r.detail}.{" "}
            <a className="text-tide" href={r.href}>
              {r.linkLabel}
            </a>
          </li>
        ))}
      </ul>
      <h2 id="install">Install on iPhone</h2>
      <p>Open WillWar in Safari, tap Share, then Add to Home Screen, then open WillWar from your Home Screen.</p>
      <h2 id="war-chest">War Chest help</h2>
      <p>Need your War Chest back early, for any reason? Email [support email] and we&apos;ll return what&apos;s left. No questions.</p>
      <h2 id="contact">Contact</h2>
      <p>[support email]. Grievance officer: [name].</p>
    </>
  );
}
