import type { Metadata } from "next";
import { ClientOnly } from "@/components/app/ClientOnly";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = { title: "Start" };

export default function StartPage() {
  return (
    <ClientOnly>
      <Onboarding />
    </ClientOnly>
  );
}
