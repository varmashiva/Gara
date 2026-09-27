import { randomUUID } from 'crypto';
import { Shipment, ShipmentDocument, ShipmentStatus } from '../models/Shipment';
import { ShipmentEvent } from '../models/ShipmentEvent';
import { SellerFulfillmentDocument } from '../models/SellerFulfillment';
import { SellerPickupLocation } from '../models/SellerPickupLocation';
import { Seller } from '../models/Seller';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { shippingProvider } from '../integrations/shipping/shippingProviderFactory';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { applyExternalStatusUpdate } from './sellerFulfillment.service';
import { ensurePickupLocationRegistered } from './sellerPickupLocation.service';
import { recordAudit } from './audit.service';
import { ShiprocketWebhookInput } from '../schemas/shipment.schema';

// Shiprocket's `current_status` strings (normalised to UPPER_SNAKE) -> ours.
// Anything not listed (OUT FOR PICKUP, UNDELIVERED/NDR, etc.) is recorded
// as an event but doesn't move the shipment.
const STATUS_MAP: Record<string, 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'> = {
  PICKED_UP: 'IN_TRANSIT',
  SHIPPED: 'IN_TRANSIT',
  IN_TRANSIT: 'IN_TRANSIT',
  REACHED_AT_DESTINATION_HUB: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RTO_INITIATED: 'FAILED',
  RTO_DELIVERED: 'FAILED',
  LOST: 'FAILED',
  DAMAGED: 'FAILED',
  DESTROYED: 'FAILED',
  CANCELED: 'FAILED',
  CANCELLED: 'FAILED',
  FAILED: 'FAILED',
};

// Webhooks can arrive out of order — never move a shipment backwards.
const STATUS_RANK: Record<ShipmentStatus, number> = {
  CREATED: 0,
  AWB_ASSIGNED: 1,
  PICKUP_SCHEDULED: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
  FAILED: 4,
};

const DEFAULT_ITEM_WEIGHT_GRAMS = 500;

function normaliseStatus(status: string) {
  return status.trim().toUpperCase().replace(/[\s-]+/g, '_');
}

async function estimateWeightKg(fulfillment: SellerFulfillmentDocument) {
  const products = await Product.find({ _id: { $in: fulfillment.items.map((item) => item.productId) } }).select('weightGrams');
  const weights = new Map(products.map((p) => [p.id as string, p.weightGrams]));
  // weightGrams is the product's net weight; variants don't carry their own
  // yet, so every unit uses the base product's (or a flat default).
  const grams = fulfillment.items.reduce(
    (sum, item) => sum + (weights.get(item.productId.toString()) || DEFAULT_ITEM_WEIGHT_GRAMS) * item.quantity,
    0
  );
  return Math.max(0.1, Math.round(grams) / 1000);
}

/**
 * Called when a fulfillment moves to READY_TO_SHIP. Creates the Shiprocket
 * order, assigns a courier/AWB, and requests pickup. Each step is saved on
 * the Shipment as it succeeds, so if a later step fails (unserviceable
 * pincode, low wallet balance...) the fulfillment stays where it was and
 * retrying resumes from the failed step instead of creating a duplicate
 * Shiprocket order.
 */
export async function createShipmentForFulfillment(fulfillment: SellerFulfillmentDocument) {
  let shipment = await Shipment.findOne({ fulfillmentId: fulfillment._id });

  if (!shipment) {
    const pickupLocation =
      (await SellerPickupLocation.findOne({ sellerId: fulfillment.sellerId, isDefault: true })) ??
      (await SellerPickupLocation.findOne({ sellerId: fulfillment.sellerId }));

    if (!pickupLocation) {
      throw AppError.badRequest('Add a pickup location before shipping orders', 'NO_PICKUP_LOCATION');
    }

    const seller = await Seller.findById(fulfillment.sellerId).select('userId');
    await ensurePickupLocationRegistered(pickupLocation, seller?.userId.toString() ?? '');

    const order = await Order.findById(fulfillment.orderId).populate<{ customerId: { email?: string } }>('customerId', 'email');
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    const subtotalRupees = fulfillment.items.reduce((sum, item) => sum + item.subtotal, 0) / 100;

    const { externalOrderId, externalShipmentId } = await shippingProvider.createShipmentOrder({
      // Shiprocket order ids must be unique per call — a multi-seller order
      // creates one Shiprocket order per seller slice, so the fulfillment id
      // (not the shared order number) disambiguates them.
      orderNumber: `${order.orderNumber}-${(fulfillment._id as { toString(): string }).toString().slice(-6)}`,
      orderDate: order.createdAt,
      pickupLocation: {
        externalPickupLocationId: pickupLocation.shiprocketPickupLocationId,
        label: pickupLocation.label,
        contactPerson: pickupLocation.contactPerson,
        phone: pickupLocation.phone,
        addressLine1: pickupLocation.addressLine1,
        addressLine2: pickupLocation.addressLine2,
        city: pickupLocation.city,
        state: pickupLocation.state,
        postalCode: pickupLocation.postalCode,
        country: pickupLocation.country,
      },
      deliveryAddress: order.shippingAddressSnapshot,
      customerEmail: order.customerId?.email,
      items: fulfillment.items.map((item) => ({
        name: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
        sku: item.sku ?? item.productId.toString(),
        units: item.quantity,
        sellingPrice: item.unitPrice / 100,
      })),
      subtotal: subtotalRupees,
      paymentMethod: 'PREPAID',
      weightKg: await estimateWeightKg(fulfillment),
    });

    shipment = await Shipment.create({
      orderId: fulfillment.orderId,
      sellerId: fulfillment.sellerId,
      fulfillmentId: fulfillment._id,
      provider: env.SHIPPING_PROVIDER_MODE === 'real' ? 'shiprocket' : 'mock',
      externalOrderId,
      externalShipmentId,
      status: 'CREATED',
      pickupLocationSnapshot: {
        label: pickupLocation.label,
        addressLine1: pickupLocation.addressLine1,
        city: pickupLocation.city,
        state: pickupLocation.state,
        postalCode: pickupLocation.postalCode,
        contactPerson: pickupLocation.contactPerson,
        phone: pickupLocation.phone,
      },
    });

    fulfillment.shipmentId = shipment._id as SellerFulfillmentDocument['shipmentId'];
    await fulfillment.save();
  }

  if (shipment.status === 'CREATED') {
    const { awbCode, courierName } = await shippingProvider.assignCourier(shipment.externalShipmentId);
    shipment.awbCode = awbCode;
    shipment.courierName = courierName;
    if (shipment.provider === 'shiprocket') {
      shipment.trackingUrl = `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`;
    }
    shipment.status = 'AWB_ASSIGNED';
    await shipment.save();
  }

  if (shipment.status === 'AWB_ASSIGNED') {
    const { scheduledAt } = await shippingProvider.requestPickup(shipment.externalShipmentId);
    shipment.pickupScheduledAt = scheduledAt;
    shipment.status = 'PICKUP_SCHEDULED';
    await shipment.save();
  }

  return shipment;
}

type ShipmentEventInput = {
  eventId: string;
  status: string;
  description?: string;
  rawPayload: unknown;
};

/**
 * The shipment webhook is the source of truth for SHIPPED/DELIVERED —
 * mirrors the payment webhook's idempotency pattern (PaymentEvent's unique
 * eventId index -> ShipmentEvent's here).
 */
async function applyShipmentEvent(shipment: ShipmentDocument, event: ShipmentEventInput) {
  try {
    await ShipmentEvent.create({
      shipmentId: shipment._id,
      eventId: event.eventId,
      status: event.status,
      description: event.description,
      rawPayload: event.rawPayload,
      processed: false,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      return { duplicate: true };
    }
    throw err;
  }

  const nextShipmentStatus = STATUS_MAP[normaliseStatus(event.status)];
  if (nextShipmentStatus && STATUS_RANK[nextShipmentStatus] > STATUS_RANK[shipment.status]) {
    shipment.status = nextShipmentStatus;
    if (nextShipmentStatus === 'IN_TRANSIT' && !shipment.shippedAt) shipment.shippedAt = new Date();
    if (nextShipmentStatus === 'DELIVERED') shipment.deliveredAt = new Date();
    await shipment.save();

    if (nextShipmentStatus === 'IN_TRANSIT') {
      await applyExternalStatusUpdate(shipment.fulfillmentId.toString(), 'SHIPPED');
    } else if (nextShipmentStatus === 'DELIVERED') {
      // A delivered event can be the first one we see (missed/late webhooks),
      // so pass through SHIPPED first — applyExternalStatusUpdate ignores it
      // if the fulfillment is already there.
      await applyExternalStatusUpdate(shipment.fulfillmentId.toString(), 'SHIPPED');
      await applyExternalStatusUpdate(shipment.fulfillmentId.toString(), 'DELIVERED');
    } else if (nextShipmentStatus === 'FAILED') {
      recordAudit({
        action: 'SHIPMENT_FAILED',
        entityType: 'Shipment',
        entityId: shipment.id,
        after: { awbCode: shipment.awbCode, courierStatus: event.status },
      });
    }
  }

  await ShipmentEvent.updateOne({ eventId: event.eventId }, { processed: true });
  return { duplicate: false };
}

/**
 * Shiprocket tracking webhook. Always answers 200 for well-authenticated
 * calls, even for AWBs we don't know (e.g. Shiprocket's "test webhook"
 * button, or shipments created by hand in their dashboard) — a non-2xx makes
 * Shiprocket keep retrying and can get the webhook disabled.
 */
export async function handleShiprocketWebhook(payload: ShiprocketWebhookInput, tokenHeader: string | undefined) {
  if (!shippingProvider.verifyWebhookToken(tokenHeader)) {
    recordAudit({
      action: 'SHIPMENT_WEBHOOK_INVALID_SIGNATURE',
      entityType: 'Shipment',
      entityId: String(payload.awb),
      after: { awb: payload.awb },
    });
    throw AppError.unauthorized('Invalid webhook token', 'INVALID_WEBHOOK_SIGNATURE');
  }

  const awb = String(payload.awb);
  const shipment = await Shipment.findOne({ awbCode: awb });
  if (!shipment) {
    return { ignored: true };
  }

  return applyShipmentEvent(shipment, {
    eventId: `${awb}:${payload.current_status_id ?? payload.current_status}:${payload.current_timestamp ?? ''}`,
    status: payload.current_status,
    description: payload.scans?.at(-1)?.activity,
    rawPayload: payload,
  });
}

export async function simulateCourierWebhook(externalShipmentId: string, status: string) {
  if (env.SHIPPING_PROVIDER_MODE !== 'mock') {
    throw AppError.forbidden('Shipping simulation is only available in mock mode', 'NOT_MOCK_MODE');
  }
  const shipment = await Shipment.findOne({ externalShipmentId });
  if (!shipment) {
    throw AppError.notFound('Unknown shipment', 'SHIPMENT_NOT_FOUND');
  }
  return applyShipmentEvent(shipment, { eventId: randomUUID(), status, rawPayload: { simulated: true, status } });
}

export async function getShipmentForFulfillment(fulfillmentId: string) {
  return Shipment.findOne({ fulfillmentId });
}
