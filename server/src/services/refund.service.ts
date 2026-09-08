import { Refund, RefundReason } from '../models/Refund';
import { Payment } from '../models/Payment';
import { paymentProvider } from '../integrations/payment/paymentProviderFactory';
import { AppError } from '../utils/errors';

export async function initiateRefund(
  orderId: string,
  amount: number,
  reason: RefundReason,
  returnRequestId?: string
) {
  const payment = await Payment.findOne({ orderId, status: 'SUCCESS' });
  if (!payment) {
    throw AppError.conflict('No successful payment found for this order to refund', 'NO_PAYMENT_TO_REFUND');
  }

  const { providerRefundId } = await paymentProvider.refund(payment.providerPaymentId!, amount);

  const refund = await Refund.create({
    orderId,
    paymentId: payment._id,
    returnRequestId,
    amount,
    reason,
    status: 'COMPLETED',
    providerRefundId,
    completedAt: new Date(),
  });

  payment.status = amount >= payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  await payment.save();

  return refund;
}
