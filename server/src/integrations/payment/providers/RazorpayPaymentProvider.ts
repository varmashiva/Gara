import crypto from 'crypto';
import {
  PaymentProvider,
  CreatePaymentOrderParams,
  CreatePaymentOrderResult,
  VerifySignatureParams,
  VerifyWebhookSignatureParams,
  RefundResult,
} from '../PaymentProvider';
import { env } from '../../../config/env';

/**
 * Razorpay Orders API — this has been Razorpay's stable, documented v1 REST
 * contract for a long time (basic-auth with key_id:key_secret, POST /orders
 * with amount in paise + currency + receipt). Still, confirm against
 * https://razorpay.com/docs/api/orders/ before going live — this has not
 * been exercised against the real API in this session, only written to the
 * documented shape.
 *
 * This provider implements TWO distinct signature schemes — do not conflate
 * them:
 *   - verifySignature(): the CLIENT-SIDE checkout-success check. Razorpay's
 *     frontend SDK hands back {order_id, payment_id, signature} after a
 *     successful checkout; this is HMAC-SHA256("order_id|payment_id",
 *     key_secret). Convenient for optimistic UI, but never trusted as the
 *     source of truth for marking an order paid — Rule 9, see
 *     payment.service.ts.
 *   - verifyWebhookSignature(): the real server-to-server WEBHOOK check.
 *     Razorpay signs the RAW request body with a separate Webhook Secret
 *     (RAZORPAY_WEBHOOK_SECRET, created in Dashboard > Settings > Webhooks —
 *     NOT the API key secret used above) as
 *     HMAC-SHA256(rawBodyBytes, webhookSecret), delivered in an
 *     X-Razorpay-Signature header. This is the one payment.service.ts's
 *     handleRazorpayWebhook() actually trusts to confirm an order.
 * The raw-body capture this needs happens once, globally, in app.ts
 * (express.json's `verify` option stashes the exact bytes on req.rawBody
 * before JSON-parsing them) — cheap enough to do for every request rather
 * than carving out a route-specific raw-body parser.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  async createOrder(params: CreatePaymentOrderParams): Promise<CreatePaymentOrderResult> {
    const auth = Buffer.from(`${env.PAYMENT_KEY}:${env.PAYMENT_SECRET}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: 'INR',
        receipt: params.orderId,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Razorpay order creation failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { id: string };
    return { providerOrderId: data.id };
  }

  verifySignature(params: VerifySignatureParams): boolean {
    const expected = crypto
      .createHmac('sha256', env.PAYMENT_SECRET)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest('hex');
    return expected === params.signature;
  }

  verifyWebhookSignature(params: VerifyWebhookSignatureParams): boolean {
    if (!env.RAZORPAY_WEBHOOK_SECRET || !params.signature) return false;

    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(params.rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(params.signature, 'utf8');
    // timingSafeEqual throws on a length mismatch rather than returning
    // false, so that case has to be handled separately.
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  // Razorpay Refunds API — POST /payments/{payment_id}/refund with amount
  // in paise. Same confidence level as createOrder above: documented,
  // stable shape, not exercised against the live API this session.
  async refund(providerPaymentId: string, amount: number): Promise<RefundResult> {
    const auth = Buffer.from(`${env.PAYMENT_KEY}:${env.PAYMENT_SECRET}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/payments/${providerPaymentId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Razorpay refund failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as { id: string };
    return { providerRefundId: data.id };
  }
}
