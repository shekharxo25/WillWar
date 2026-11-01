import "server-only";

/**
 * Refunds for War Chest stakes. The payments workstream owns the full Razorpay adapter;
 * this module is the narrow interface the settlement cron and account deletion depend on.
 * Razorpay refunds use X-Refund-Idempotency so a retried call never refunds twice
 * (we pass the war_chest_id as the key).
 */
export type RefundFn = (paymentRef: string, amountMinor: number, idempotencyKey: string) => Promise<{ id: string }>;

export const mockRefund: RefundFn = async (_paymentRef, _amountMinor, idempotencyKey) => ({ id: `rfnd_mock_${idempotencyKey}` });

/** Real refund over fetch (works on Workers). POST /v1/payments/:id/refund, amount in minor units. */
export const razorpayRefund: RefundFn = async (paymentRef, amountMinor, idempotencyKey) => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("razorpay_not_configured");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentRef)}/refund`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${keyId}:${secret}`)}`,
      "content-type": "application/json",
      "X-Refund-Idempotency": idempotencyKey,
    },
    body: JSON.stringify({ amount: amountMinor, speed: "normal", notes: { kind: "war_chest_refund", war_chest_id: idempotencyKey } }),
  });
  if (!res.ok) throw new Error(`refund_failed_${res.status}`);
  const body = (await res.json()) as { id?: string };
  if (!body.id) throw new Error("refund_failed_no_id");
  return { id: body.id };
};

let override: RefundFn | null = null;
/** Lets the payments adapter (or a test) install its implementation. */
export function setRefundFn(fn: RefundFn | null) {
  override = fn;
}

/** Mock unless Razorpay keys exist. The mock is never used in production with keys set. */
export function getRefundFn(): RefundFn {
  if (override) return override;
  return process.env.RAZORPAY_KEY_SECRET && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? razorpayRefund : mockRefund;
}

export type DueRefund = { war_chest_id: string; payment_ref: string | null; refund_minor: number; refund_currency: string };

/**
 * Issues each refund, then records it. A failure leaves the chest in 'settling' so the
 * next run retries with the same idempotency key. Logs carry the chest id only.
 */
export async function issueRefunds(
  rows: DueRefund[],
  record: (chestId: string, refundId: string, amountMinor: number) => Promise<void>,
  refund: RefundFn = getRefundFn(),
): Promise<{ refunded: string[]; failed: string[] }> {
  const refunded: string[] = [];
  const failed: string[] = [];
  for (const r of rows) {
    if (r.refund_minor <= 0 || !r.payment_ref) continue;
    try {
      const { id } = await refund(r.payment_ref, r.refund_minor, r.war_chest_id);
      await record(r.war_chest_id, id, r.refund_minor);
      refunded.push(r.war_chest_id);
    } catch (e) {
      console.error("war_chest_refund_failed", r.war_chest_id, (e as Error).message);
      failed.push(r.war_chest_id);
    }
  }
  return { refunded, failed };
}
