import { SellerFulfillment, SellerFulfillmentDocument, SellerFulfillmentStatus } from '../models/SellerFulfillment';
import { getSellerByUserId } from './seller.service';
import { recomputeOrderStatus } from './order.service';
import { AppError } from '../utils/errors';

// What a seller can click manually. READY_TO_SHIP has no seller-driven exit
// — reaching it hands off to Shiprocket (createShipmentForFulfillment), and
// SHIPPED/DELIVERED from there on are driven by the shipment webhook via
// applyExternalStatusUpdate below, not a button.
const SELLER_ALLOWED_TRANSITIONS: Record<SellerFulfillmentStatus, SellerFulfillmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'FAILED'],
  READY_TO_SHIP: [],
  SHIPPED: [],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

const SYSTEM_ALLOWED_TRANSITIONS: Partial<Record<SellerFulfillmentStatus, SellerFulfillmentStatus[]>> = {
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

export async function listMyFulfillments(userId: string, status?: SellerFulfillmentStatus) {
  const seller = await getSellerByUserId(userId);
  const filter: Record<string, unknown> = { sellerId: seller._id };
  if (status) filter.status = status;
  return SellerFulfillment.find(filter).populate('shipmentId').sort({ createdAt: -1 });
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
  const fulfillment = await findOwnedFulfillment(userId, fulfillmentId);
  return fulfillment.populate('shipmentId');
}

async function pushStatus(fulfillment: SellerFulfillmentDocument, status: SellerFulfillmentStatus) {
  fulfillment.status = status;
  fulfillment.statusHistory.push({ status, at: new Date() });
  await fulfillment.save();
  await recomputeOrderStatus(fulfillment.orderId.toString());
}

export async function updateFulfillmentStatus(
  userId: string,
  fulfillmentId: string,
  nextStatus: SellerFulfillmentStatus
) {
  const fulfillment = await findOwnedFulfillment(userId, fulfillmentId);

  const allowed = SELLER_ALLOWED_TRANSITIONS[fulfillment.status];
  if (!allowed.includes(nextStatus)) {
    throw AppError.conflict(
      `Cannot move fulfillment from ${fulfillment.status} to ${nextStatus}`,
      'INVALID_FULFILLMENT_TRANSITION'
    );
  }

  if (nextStatus === 'READY_TO_SHIP') {
    // Lazy import to avoid a circular import at module-load time
    // (shipping.service imports applyExternalStatusUpdate from this file).
    const { createShipmentForFulfillment } = await import('./shipping.service');
    await createShipmentForFulfillment(fulfillment);
  }

  await pushStatus(fulfillment, nextStatus);
  return fulfillment;
}

/**
 * Webhook-driven transition (shipment status events) — no user/ownership
 * context, since it's the courier's system calling us, not the seller.
 */
export async function applyExternalStatusUpdate(fulfillmentId: string, nextStatus: SellerFulfillmentStatus) {
  const fulfillment = await SellerFulfillment.findById(fulfillmentId);
  if (!fulfillment) return;

  const allowed = SYSTEM_ALLOWED_TRANSITIONS[fulfillment.status] ?? [];
  if (!allowed.includes(nextStatus)) return; // stale/out-of-order event — ignore rather than throw

  await pushStatus(fulfillment, nextStatus);
}
