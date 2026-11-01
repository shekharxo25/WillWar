"use client";

import { use } from "react";
import { ClientOnly } from "@/components/app/ClientOnly";
import { JoinScreen, PactDetailScreen } from "./PactScreens";

export function PactDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PactDetailScreen id={id} />;
}

export function JoinRoute({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <ClientOnly>
      <JoinScreen code={code} />
    </ClientOnly>
  );
}
