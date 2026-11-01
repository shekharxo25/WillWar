import type { Metadata } from "next";

export const metadata: Metadata = { title: "Health and safety" };

export default function HealthPage() {
  return (
    <>
      <h1>Health and safety</h1>
      <p>WillWar is not medical advice and makes no health or performance claims. Articles in Learn show an evidence grade and their sources.</p>
      <p>If urges or habits are hurting your life, your relationships or your work, talk to a doctor or counselor. If you feel unsafe, call your local emergency number or a helpline listed on our support page.</p>
    </>
  );
}
