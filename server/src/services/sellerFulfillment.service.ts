import { SellerFulfillment, SellerFulfillmentStatus } from '../models/SellerFulfillment';
import { getSellerByUserId } from './seller.service';
import { recomputeOrderStatus } from './order.service';
import { AppError } from '../utils/errors';

const ALLOWED_TRANSITIONS: Record<SellerFulfillmentStatus, SellerFulfillmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'FAILED'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

export async function listMyFulfillments(userId: string, status?: SellerFulfillmentStatus) {
  const seller = await getSellerByUserId(userId);
  const filter: Record<string, unknown> = { sellerId: seller._id };
  if (status) filter.status = status;
  return SellerFulfillment.find(filter).sort({ createdAt: -1 });
}

async function findOwnedFulfillment(userId: string, fulfillmentId: string) {
  const seller = await getSellerByUserId(userId);
  const fulfillment = await SellerFulfillment.findOne({ _id: fulfillmentId, sellerId: seller._id });
  if (!fulfillment) {
    throw AppError.notFound('Fulfillment not found', 'FULFILLMENT_NOT_FOUND');
  }
  return fulfillment;
}

export async function getMyFulfillment(userId: string, fulfillmentId: string) {
  return findOwnedFulfillment(userId, fulfillmentId);
}

export async function updateFulfillmentStatus(
  userId: string,
  fulfillmentId: string,
  nextStatus: SellerFulfillmentStatus
) {
  const fulfillment = await findOwnedFulfillment(userId, fulfillmentId);

  const allowed = ALLOWED_TRANSITIONS[fulfillment.status];
  if (!allowed.includes(nextStatus)) {
    throw AppError.conflict(
      `Cannot move fulfillment from ${fulfillment.status} to ${nextStatus}`,
      'INVALID_FULFILLMENT_TRANSITION'
    );
  }

  fulfillment.status = nextStatus;
  fulfillment.statusHistory.push({ status: nextStatus, at: new Date() });
  await fulfillment.save();

  await recomputeOrderStatus(fulfillment.orderId.toString());

  return fulfillment;
}
