import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isProduction } from "@/lib/config/flags";
import { MockCheckout } from "./MockCheckout";

export const metadata = { title: "Mock checkout" };

/** Dev-only mock checkout. Never available when NODE_ENV=production. */
export default function DevPayments() {
  if (isProduction()) notFound();
  return (
    <Suspense>
      <MockCheckout />
    </Suspense>
  );
}
