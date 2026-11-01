"use client";

// Razorpay Checkout in the browser. Loaded only on /app/pro and /app/war-chest when
// someone taps pay. Confirmation always waits for the verified webhook, so this only
// reports whether the sheet was submitted.

interface RazorpayOptions {
  key: string;
  order_id?: string;
  subscription_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: () => void;
  modal: { ondismiss: () => void };
}

type RazorpayCtor = new (opts: RazorpayOptions) => { open: () => void };

let loading: Promise<RazorpayCtor> | null = null;

export function loadRazorpay(): Promise<RazorpayCtor> {
  loading ??= new Promise((resolve, reject) => {
    const w = window as Window & { Razorpay?: RazorpayCtor };
    if (w.Razorpay) return resolve(w.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error("razorpay_unavailable")));
    s.onerror = () => {
      loading = null;
      reject(new Error("razorpay_unavailable"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export interface CheckoutParams {
  key: string;
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  description: string;
}

export async function openCheckout(p: CheckoutParams): Promise<"dismissed" | "submitted"> {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve) => {
    new Razorpay({
      key: p.key,
      order_id: p.orderId,
      subscription_id: p.subscriptionId,
      amount: p.amount,
      currency: p.currency,
      name: "WillWar",
      description: p.description,
      theme: { color: "#0B6E7F" },
      handler: () => resolve("submitted"),
      modal: { ondismiss: () => resolve("dismissed") },
    }).open();
  });
}
