import crypto from 'crypto';
import {
  PaymentProvider,
  CreatePaymentOrderParams,
  CreatePaymentOrderResult,
  VerifySignatureParams,
  RefundResult,
} from '../PaymentProvider';
import { env } from '../../../config/env';

/**
 * Razorpay Orders API — this has been Razorpay's stable, documented v1 REST
 * contract for a long time (basic-auth with key_id:key_secret, POST /orders
 * with amount in paise + currency + receipt). Still, confirm against
 * https://razorpay.com/docs/api/orders/ before going live — this has not
 * been exercised against the real API in this session (no credentials
 * available here), only written to the documented shape.
 *
 * Signature verification here is Razorpay's documented HMAC-SHA256 of
 * "{order_id}|{payment_id}" using the key secret — this is the CLIENT-SIDE
 * checkout-success verification scheme (what the frontend SDK hands back
 * after payment), and it's what this method implements.
 *
 * IMPORTANT / SECURITY: this is a DIFFERENT scheme from Razorpay's actual
 * server-to-server WEBHOOK signature, which this class does NOT implement.
 * A real Razorpay webhook:
 *   - is signed with a separate Webhook Secret (configured in the Razorpay
 *     dashboard, NOT env.PAYMENT_SECRET / the API key secret used above),
 *   - signs the raw request body bytes (HMAC-SHA256(rawBody, webhookSecret)),
 *     not "order_id|payment_id",
 *   - is delivered in an X-Razorpay-Signature HEADER, not a body field,
 *   - and its JSON payload shape is Razorpay's own event envelope
 *     ({event, payload: {payment: {entity: {...}}}, ...}), not the
 *     {eventId, providerOrderId, providerPaymentId, status, signature}
 *     shape this codebase's /payments/webhook route expects.
 * Wiring a real Razorpay account therefore needs, in addition to this
 * class: (1) capturing the raw body for that one route BEFORE the global
 * JSON body-parser runs (e.g. express.raw() mounted on that path first,
 * the standard Stripe/Razorpay-in-Express pattern), (2) a real HMAC-over-
 * raw-body check against X-Razorpay-Signature using a new
 * RAZORPAY_WEBHOOK_SECRET env var, and (3) a small adapter that maps
 * Razorpay's event envelope into this app's internal webhook shape before
 * calling payment.service.handleWebhook. None of that exists yet — the
 * current /payments/webhook contract was designed around MockPaymentProvider
 * for local dev/test, and this class's verifySignature would silently
 * reject every real Razorpay webhook delivery as-is. Flagging this
 * explicitly rather than leaving it subtly wrong.
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
