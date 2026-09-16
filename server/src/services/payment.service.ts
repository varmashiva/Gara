import { Payment } from '../models/Payment';
import { PaymentEvent } from '../models/PaymentEvent';
import { paymentProvider } from '../integrations/payment/paymentProviderFactory';
import { getOrderForPayment, confirmPayment, failOrExpireOrder } from './order.service';
import { recordAudit } from './audit.service';
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

  // Razorpay's checkout.js widget (Checkout.js) needs the public key_id
  // client-side to open the payment popup — that's a publishable
  // identifier, not the secret, safe to hand to the browser. Only returned
  // for the real provider; the mock provider has no widget to open.
  const keyId = env.PAYMENT_PROVIDER_MODE === 'real' ? env.PAYMENT_KEY : undefined;

  const existing = await Payment.findOne({ orderId: order._id, status: 'PENDING' });
  if (existing) {
    return { providerOrderId: existing.providerOrderId, amount: existing.amount, provider: existing.provider, keyId };
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

  return { providerOrderId, amount: order.grandTotal, provider, keyId };
}

async function applyPaymentUpdate(
  payment: InstanceType<typeof Payment>,
  status: 'captured' | 'failed',
  providerPaymentId: string
) {
  if (status === 'captured' && payment.status !== 'SUCCESS') {
    payment.status = 'SUCCESS';
    payment.providerPaymentId = providerPaymentId;
    await payment.save();
    await confirmPayment(payment.orderId.toString());
    recordAudit({ action: 'PAYMENT_CAPTURED', entityType: 'Payment', entityId: payment.id });
  } else if (status === 'failed' && payment.status !== 'FAILED') {
    payment.status = 'FAILED';
    await payment.save();
    await failOrExpireOrder(payment.orderId.toString(), 'PAYMENT_FAILED');
    recordAudit({ action: 'PAYMENT_FAILED', entityType: 'Payment', entityId: payment.id });
  }
}

/**
 * The webhook is the source of truth (Rule 9) — never called directly from
 * a "payment succeeded" message the frontend sends. Idempotency has two
 * layers: the PaymentEvent unique index on eventId (a duplicate webhook
 * delivery for the exact same event is rejected at insert time before any
 * side effect runs), and the payment/order status checks below (guards
 * against two DIFFERENT event ids somehow representing the same logical
 * outcome).
 *
 * This is the MockPaymentProvider / client-side-scheme path (PAYMENT_PROVIDER_MODE=mock,
 * or the client-side checkout-signature shape). For real Razorpay webhook
 * deliveries see handleRazorpayWebhook below — different signature scheme,
 * different payload shape entirely.
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
    recordAudit({
      action: 'PAYMENT_WEBHOOK_INVALID_SIGNATURE',
      entityType: 'Payment',
      entityId: payment.id,
      after: { providerOrderId: payload.providerOrderId },
    });
    throw AppError.badRequest('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }

  await applyPaymentUpdate(payment, payload.status, payload.providerPaymentId);
  await PaymentEvent.updateOne({ eventId: payload.eventId }, { processed: true });

  return { duplicate: false };
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

/**
 * Real Razorpay webhook entry point — only reachable when
 * PAYMENT_PROVIDER_MODE=real (see payment.controller.ts). Signature is
 * verified over the RAW request body against RAZORPAY_WEBHOOK_SECRET
 * (a separate credential from the API key/secret, from the Razorpay
 * dashboard) BEFORE any database read/write, so an unauthenticated
 * payload can never touch the database. Only payment.captured and
 * payment.failed are acted on; every other Razorpay event type
 * (order.paid, payment.authorized, refund.*, ...) is acknowledged
 * without action so Razorpay stops retrying it.
 */
export async function handleRazorpayWebhook(rawBody: Buffer, signature: string, body: RazorpayWebhookBody) {
  const signatureValid = paymentProvider.verifyWebhookSignature({ rawBody, signature });

  if (!signatureValid) {
    recordAudit({
      action: 'PAYMENT_WEBHOOK_INVALID_SIGNATURE',
      entityType: 'Payment',
      entityId: body?.payload?.payment?.entity?.order_id ?? 'unknown',
      after: { source: 'razorpay-webhook', event: body?.event },
    });
    throw AppError.badRequest('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }

  const event = body.event;
  const status: 'captured' | 'failed' | null =
    event === 'payment.captured' ? 'captured' : event === 'payment.failed' ? 'failed' : null;

  if (!status) {
    return { duplicate: false, ignored: true };
  }

  const entity = body.payload?.payment?.entity;
  const providerOrderId = entity?.order_id;
  const providerPaymentId = entity?.id;
  if (!providerOrderId || !providerPaymentId) {
    return { duplicate: false, ignored: true };
  }

  const eventId = `${providerPaymentId}:${event}`;

  const payment = await Payment.findOne({ providerOrderId });
  if (!payment) {
    throw AppError.notFound('Unknown payment order', 'PAYMENT_NOT_FOUND');
  }

  try {
    await PaymentEvent.create({
      paymentId: payment._id,
      eventId,
      eventType: status,
      rawPayload: body,
      processed: false,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      return { duplicate: true };
    }
    throw err;
  }

  await applyPaymentUpdate(payment, status, providerPaymentId);
  await PaymentEvent.updateOne({ eventId }, { processed: true });

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
