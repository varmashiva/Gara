import { ReturnRequest } from '../models/ReturnRequest';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { SellerFulfillment } from '../models/SellerFulfillment';
import { SellerEarning } from '../models/SellerEarning';
import { AppError } from '../utils/errors';
import { initiateRefund } from './refund.service';
import { notify } from './notification.service';

export async function requestReturn(userId: string, input: { orderId: string; productId: string; reason: string }) {
  const order = await Order.findOne({ _id: input.orderId, customerId: userId });
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');

  const fulfillment = await SellerFulfillment.findOne({
    orderId: order._id,
    'items.productId': input.productId,
    status: 'DELIVERED',
  });
  if (!fulfillment) {
    throw AppError.forbidden('This item is not eligible for return (not delivered)', 'NOT_ELIGIBLE_FOR_RETURN');
  }

  const product = await Product.findById(input.productId);
  if (!product) throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  const category = await Category.findById(product.categoryId);

  const returnable = product.returnOverride?.returnable ?? category?.returnPolicy.returnable ?? false;
  if (!returnable) {
    throw AppError.forbidden('This product is not eligible for returns', 'PRODUCT_NOT_RETURNABLE');
  }

  const windowDays = product.returnOverride?.returnWindowDays ?? category?.returnPolicy.returnWindowDays ?? 0;
  const deliveredEntry = [...fulfillment.statusHistory].reverse().find((h) => h.status === 'DELIVERED');
  const deliveredAt = deliveredEntry?.at ?? fulfillment.updatedAt;
  const windowExpiresAt = new Date(deliveredAt.getTime() + windowDays * 24 * 60 * 60 * 1000);
  if (new Date() > windowExpiresAt) {
    throw AppError.forbidden('The return window for this product has passed', 'RETURN_WINDOW_EXPIRED');
  }

  const existing = await ReturnRequest.findOne({
    orderId: order._id,
    productId: input.productId,
    status: 'REQUESTED',
  });
  if (existing) {
    throw AppError.conflict('A return request for this item is already pending', 'RETURN_ALREADY_REQUESTED');
  }

  return ReturnRequest.create({
    orderId: order._id,
    sellerFulfillmentId: fulfillment._id,
    productId: input.productId,
    customerId: userId,
    reason: input.reason,
  });
}

export async function listMyReturns(userId: string) {
  return ReturnRequest.find({ customerId: userId }).sort({ requestedAt: -1 });
}

export async function listAllReturnsForAdmin() {
  return ReturnRequest.find().sort({ requestedAt: -1 });
}

export async function decideReturn(
  returnRequestId: string,
  adminUserId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes?: string
) {
  const returnRequest = await ReturnRequest.findById(returnRequestId);
  if (!returnRequest) throw AppError.notFound('Return request not found', 'RETURN_NOT_FOUND');
  if (returnRequest.status !== 'REQUESTED') {
    throw AppError.conflict('This return request has already been decided', 'RETURN_ALREADY_DECIDED');
  }

  returnRequest.status = decision;
  returnRequest.decidedAt = new Date();
  returnRequest.decidedBy = adminUserId as unknown as typeof returnRequest.decidedBy;
  returnRequest.decisionNotes = notes;

  const order = await Order.findById(returnRequest.orderId);
  await notify(
    returnRequest.customerId.toString(),
    decision === 'APPROVED' ? 'RETURN_APPROVED' : 'RETURN_REJECTED',
    decision === 'APPROVED' ? 'Your return was approved' : 'Your return was rejected',
    decision === 'APPROVED'
      ? `Your return for order ${order?.orderNumber ?? ''} was approved and a refund has been initiated.`
      : `Your return for order ${order?.orderNumber ?? ''} was rejected.${notes ? ` Notes: ${notes}` : ''}`
  );

  if (decision === 'APPROVED') {
    const item = order?.items.find((i) => i.productId.toString() === returnRequest.productId.toString());
    if (order && item) {
      await initiateRefund(order.id, item.subtotal, 'RETURN', returnRequest.id);

      const earning = await SellerEarning.findOne({ sellerFulfillmentId: returnRequest.sellerFulfillmentId });
      if (earning) {
        earning.refundDeduction += item.subtotal;
        earning.netPayable = Math.max(0, earning.netPayable - item.subtotal);
        await earning.save();
      }
    }
    returnRequest.status = 'COMPLETED';
  }

  await returnRequest.save();
  return returnRequest;
}
