import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientOnly } from "@/components/app/ClientOnly";
import { ProScreen } from "@/components/me/ProScreen";

export const metadata: Metadata = { title: "Pro" };

export default function ProPage() {
  return (
    <ClientOnly>
      <Suspense>
        <ProScreen />
      </Suspense>
    </ClientOnly>
  );
}
