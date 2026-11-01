import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms</h1>
      <p>Last updated [date]. Draft pending legal review.</p>
      <h2>Who can use WillWar</h2>
      <p>You must be 18 or over. WillWar is a self-help tool, not medical treatment.</p>
      <h2>Your account</h2>
      <p>Pick a handle that isn&apos;t your real name. Don&apos;t impersonate anyone or use offensive handles or pact names.</p>
      <h2>Pro</h2>
      <p>The season pass doesn&apos;t renew. The annual plan renews each year until you cancel. Prices include taxes.</p>
      <h2>The War Chest</h2>
      <p>
        Pending legal review. Promise mode moves no money. If paid stakes are switched on: each reset sends a share to the
        cause you chose, the rest is refunded after your challenge ends, you can cancel within 24 hours, and WillWar never
        keeps forfeited money. There is no money between users, ever.
      </p>
      <h2>Contact</h2>
      <p>[support email]</p>
    </>
  );
}
