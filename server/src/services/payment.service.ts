import { Payment } from '../models/Payment';
import { PaymentEvent } from '../models/PaymentEvent';
import { paymentProvider } from '../integrations/payment/paymentProviderFactory';
import { getOrderForPayment, confirmPayment, failOrExpireOrder } from './order.service';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { randomUUID } from 'crypto';
import { WebhookInput } from '../schemas/payment.schema';

export async function createPaymentOrder(userId: string, orderId: string) {
  const order = await getOrderForPayment(orderId);
  if (order.customerId.toString() !== userId) {
    throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }
  if (order.orderStatus !== 'PAYMENT_PENDING') {
    throw AppError.conflict('This order is not awaiting payment', 'INVALID_ORDER_STATE');
  }

  const existing = await Payment.findOne({ orderId: order._id, status: 'PENDING' });
  if (existing) {
    return { providerOrderId: existing.providerOrderId, amount: existing.amount, provider: existing.provider };
  }

  const provider = env.PAYMENT_PROVIDER_MODE === 'real' ? 'razorpay' : 'mock';
  const { providerOrderId } = await paymentProvider.createOrder({
    orderId: (order._id as { toString(): string }).toString(),
    amount: order.grandTotal,
  });

  await Payment.create({
    orderId: order._id,
    provider,
    providerOrderId,
    amount: order.grandTotal,
    status: 'PENDING',
  });

  return { providerOrderId, amount: order.grandTotal, provider };
}

/**
 * The webhook is the source of truth (Rule 9) — never called directly from
 * a "payment succeeded" message the frontend sends. Idempotency has two
 * layers: the PaymentEvent unique index on eventId (a duplicate webhook
 * delivery for the exact same event is rejected at insert time before any
 * side effect runs), and the payment/order status checks below (guards
 * against two DIFFERENT event ids somehow representing the same logical
 * outcome).
 */
export async function handleWebhook(payload: WebhookInput) {
  const payment = await Payment.findOne({ providerOrderId: payload.providerOrderId });
  if (!payment) {
    throw AppError.notFound('Unknown payment order', 'PAYMENT_NOT_FOUND');
  }

  try {
    await PaymentEvent.create({
      paymentId: payment._id,
      eventId: payload.eventId,
      eventType: payload.status,
      rawPayload: payload,
      processed: false,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      return { duplicate: true };
    }
    throw err;
  }

  const signatureValid = paymentProvider.verifySignature({
    providerOrderId: payload.providerOrderId,
    providerPaymentId: payload.providerPaymentId,
    signature: payload.signature,
  });

  if (!signatureValid) {
    throw AppError.badRequest('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }

  if (payload.status === 'captured' && payment.status !== 'SUCCESS') {
    payment.status = 'SUCCESS';
    payment.providerPaymentId = payload.providerPaymentId;
    await payment.save();
    await confirmPayment(payment.orderId.toString());
  } else if (payload.status === 'failed' && payment.status !== 'FAILED') {
    payment.status = 'FAILED';
    await payment.save();
    await failOrExpireOrder(payment.orderId.toString(), 'PAYMENT_FAILED');
  }

  await PaymentEvent.updateOne({ eventId: payload.eventId }, { processed: true });

  return { duplicate: false };
}

/**
 * Dev/test convenience standing in for the gateway actually calling our
 * webhook — only meaningful while PAYMENT_PROVIDER_MODE=mock. Builds the
 * same payload shape a real webhook would send, with the mock provider's
 * fixed valid signature.
 */
export async function simulateGatewayWebhook(providerOrderId: string, status: 'captured' | 'failed') {
  if (env.PAYMENT_PROVIDER_MODE !== 'mock') {
    throw AppError.forbidden('Payment simulation is only available in mock mode', 'NOT_MOCK_MODE');
  }
  return handleWebhook({
    eventId: randomUUID(),
    providerOrderId,
    providerPaymentId: `mock_payment_${randomUUID()}`,
    status,
    signature: 'mock-signature',
  });
}
