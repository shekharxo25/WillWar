import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy</h1>
      <p>Last updated [date]. WillWar is for adults (18+). This policy covers what we store, why, and how to remove it.</p>
      <h2>What we store</h2>
      <ul>
        <li>Email, for sign-in and receipts (only if you create an online account).</li>
        <li>Your handle, pebble, timezone, morning-line tone, reason tags and preferences.</li>
        <li>The time the age check ran. Never your date of birth.</li>
        <li>Streak start and end times, daily check-ins, and reset tags from a fixed list (never free text).</li>
        <li>Urge game sessions: game, length, and the intensity you chose.</li>
        <li>Pact membership, challenges and preset nudges.</li>
        <li>Subscription status and payment references, and War Chest amounts, rules, causes and events.</li>
        <li>Product events from a fixed list, with no sensitive details.</li>
      </ul>
      <h2>What we never store on our servers</h2>
      <ul>
        <li>Your date of birth, real name, photos, contacts or precise location.</li>
        <li>Free-text notes about resets, your journal, or coach conversations.</li>
        <li>Advertising IDs. Ads are non-personalized.</li>
      </ul>
      <h2>On this device</h2>
      <p>Without an online account, everything stays in your browser&apos;s storage on this device. Clearing site data deletes it.</p>
      <h2>Who else sees it</h2>
      <p>Pact members see your handle, pebble and streak numbers only, never reset reasons, times or notes. Processors: Supabase (storage), Cloudflare (hosting), Anthropic (morning lines and coach, minimal context), Razorpay (payments), Resend (sign-in email).</p>
      <h2>Your rights</h2>
      <p>Export everything from Settings, Export my data. Delete everything from Settings, Delete my account. Backups age out within [30] days.</p>
      <h2>Contact</h2>
      <p>Grievance officer: [name], [support email].</p>
    </>
  );
}
