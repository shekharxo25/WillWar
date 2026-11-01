import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinRoute } from "@/components/pact/PactRoutes";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage({ params }: PageProps<"/app/join/[code]">) {
  return (
    <Suspense>
      <JoinRoute params={params} />
    </Suspense>
  );
}
