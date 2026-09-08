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
 * Signature verification is Razorpay's documented HMAC-SHA256 of
 * "{order_id}|{payment_id}" using the key secret — this part is simple
 * enough and stable enough to implement directly rather than mock.
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
