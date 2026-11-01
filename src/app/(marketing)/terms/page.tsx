import type { Metadata } from "next";
import { StaticPage } from "@/components/landing/StaticPage";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <StaticPage title="Terms" draft>
      <h2>Who can use WillWar</h2>
      <p>You must be 18 or over. Accounts found to belong to anyone younger are closed.</p>
      <h2>What WillWar is</h2>
      <p>A streak tracker and self-help tool. It isn&apos;t medical advice, therapy or a substitute for either.</p>
      <h2>Pro</h2>
      <p>
        The season pass is a one-time payment that lasts until the season&apos;s last day. Annual renews each year until you
        cancel in Settings. Prices include taxes.
      </p>
      <h2>The War Chest</h2>
      <p>
        Optional. In promise mode no money moves: you name an amount and a cause, and if you reset you donate your share
        yourself. WillWar never keeps any War Chest money and never lets money pass between users. A full War Chest section
        will be added after legal review.
      </p>
      <h2>Camps</h2>
      <p>Handles only, no photos and no free-text messages. You can mute, leave or report at any time.</p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@example.com">hello@example.com</a>
      </p>
    </StaticPage>
  );
}
