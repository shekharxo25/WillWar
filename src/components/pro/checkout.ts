"use client";
import type { PlanId } from "@/lib/config/plans";

type RazorpayOptions = Record<string, unknown> & { handler: () => void; modal?: { ondismiss?: () => void } };
type RazorpayCtor = new (o: RazorpayOptions) => { open(): void };

let loading: Promise<RazorpayCtor> | null = null;

/** Loads Razorpay Checkout only at click time, only from /app/pro. */
function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("razorpay_missing")));
    s.onerror = () => {
      loading = null;
      reject(new Error("razorpay_load_failed"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export type CheckoutOutcome = { kind: "mock"; url: string } | { kind: "opened" } | { kind: "error"; code: string };

/**
 * Starts checkout. Success in the Razorpay sheet does not grant Pro by itself:
 * the verified webhook writes the entitlement and the app refreshes.
 */
export async function startCheckout(plan: PlanId, onPaid: () => void, onDismiss: () => void): Promise<CheckoutOutcome> {
  const res = await fetch("/api/razorpay/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, string | number | boolean | undefined>;
  if (!res.ok) return { kind: "error", code: String(data.error ?? "checkout_failed") };
  if (data.mock) return { kind: "mock", url: String(data.url) };
  try {
    const Razorpay = await loadRazorpay();
    const rz = new Razorpay({
      key: data.keyId,
      name: "WillWar",
      description: data.description,
      ...(data.orderId ? { order_id: data.orderId, amount: data.amount, currency: data.currency } : { subscription_id: data.subscriptionId }),
      theme: { color: getComputedStyle(document.documentElement).getPropertyValue("--housing").trim() },
      handler: onPaid,
      modal: { ondismiss: onDismiss },
    });
    rz.open();
    return { kind: "opened" };
  } catch {
    return { kind: "error", code: "razorpay_load_failed" };
  }
}
