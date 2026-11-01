import type { Metadata } from "next";
import { Suspense } from "react";
import { PactDetailRoute } from "@/components/pact/PactRoutes";

export const metadata: Metadata = { title: "Pact" };

export default function PactDetailPage({ params }: PageProps<"/app/pact/[id]">) {
  return (
    <Suspense>
      <PactDetailRoute params={params} />
    </Suspense>
  );
}
