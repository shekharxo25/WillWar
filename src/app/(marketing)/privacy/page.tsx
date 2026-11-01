import type { Metadata } from "next";
import { StaticPage } from "@/components/landing/StaticPage";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <StaticPage title="Privacy" draft>
      <p>WillWar is built to know as little about you as it can and still work.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your email, for sign-in and receipts.</li>
        <li>Your handle, locker number, timezone, corner talk tone, reason tags and settings.</li>
        <li>The time you confirmed you&apos;re 18 or over. Never your date of birth.</li>
        <li>Streak start and end times, and each day&apos;s check-in status.</li>
        <li>Reset tags from a fixed list, for 24 months. Never free text.</li>
        <li>Round sessions: the game, its length and the before and after intensity, for 24 months.</li>
        <li>Corner talk lines, cached for 90 days.</li>
        <li>Camp membership, challenges and preset nudges (nudges for 90 days).</li>
        <li>Subscription and payment references, as tax law requires.</li>
        <li>Push subscription endpoints, until you turn reminders off.</li>
        <li>Your goal end date, pledge time and any War Chest details.</li>
        <li>Product events with allowlisted names and no sensitive details, for 13 months.</li>
      </ul>
      <h2>What we never store</h2>
      <p>
        Your date of birth, real name, free-text reset reasons, journal entries (they stay on your phone unless you turn on an
        encrypted backup with your own passphrase), coach conversations, photos, contacts, precise location or advertising
        IDs.
      </p>
      <h2>Who sees what</h2>
      <p>
        Your camp sees your handle, locker number, current streak, best streak in the season, days kept and last check-in
        date. Never reset times, reasons or counts, War Chest details, round data, corner talk or subscription status.
      </p>
      <h2>Ads</h2>
      <p>Free users see a small number of non-personalized ads in a few places. Ads never use what you do in the app. Pro has no ads.</p>
      <h2>Your rights</h2>
      <p>Export your data or delete your account at any time from Settings. Deletion returns any War Chest stake first.</p>
      <h2>Adults only</h2>
      <p>WillWar is for people 18 and over. We don&apos;t knowingly collect anything from anyone younger.</p>
    </StaticPage>
  );
}
