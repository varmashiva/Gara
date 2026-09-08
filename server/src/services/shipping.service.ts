import { randomUUID } from 'crypto';
import { Shipment } from '../models/Shipment';
import { ShipmentEvent } from '../models/ShipmentEvent';
import { SellerFulfillmentDocument } from '../models/SellerFulfillment';
import { SellerPickupLocation } from '../models/SellerPickupLocation';
import { Order } from '../models/Order';
import { shippingProvider } from '../integrations/shipping/shippingProviderFactory';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { applyExternalStatusUpdate } from './sellerFulfillment.service';

const STATUS_MAP: Record<string, 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'> = {
  picked_up: 'IN_TRANSIT',
  in_transit: 'IN_TRANSIT',
  delivered: 'DELIVERED',
  failed: 'FAILED',
};

/**
 * Called when a seller moves a fulfillment to READY_TO_SHIP. Creates the
 * Shiprocket order, assigns a courier/AWB, and requests pickup — all three
 * must succeed for the fulfillment transition itself to succeed, so a
 * failure here (most commonly: no pickup location registered yet) leaves
 * the fulfillment untouched rather than silently stuck in a half-shipped
 * state.
 */
export async function createShipmentForFulfillment(fulfillment: SellerFulfillmentDocument) {
  const pickupLocation =
    (await SellerPickupLocation.findOne({ sellerId: fulfillment.sellerId, isDefault: true })) ??
    (await SellerPickupLocation.findOne({ sellerId: fulfillment.sellerId }));

  if (!pickupLocation) {
    throw AppError.badRequest(
      'Add a pickup location in your seller settings before shipping orders',
      'NO_PICKUP_LOCATION'
    );
  }

  const order = await Order.findById(fulfillment.orderId);
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
    items: fulfillment.items.map((item) => ({
      name: item.productName,
      sku: item.sku ?? item.productId.toString(),
      units: item.quantity,
      sellingPrice: item.unitPrice / 100,
    })),
    subtotal: subtotalRupees,
    paymentMethod: 'PREPAID',
    // Simplification: Product doesn't track per-item weight yet, so a flat
    // estimate is used. Real per-product weight is a natural follow-up once
    // sellers start entering it (Product.weightGrams already exists for
    // display but isn't wired into shipping calculations yet).
    weightKg: 0.5 * fulfillment.items.reduce((sum, item) => sum + item.quantity, 0),
  });

  const { awbCode, courierName } = await shippingProvider.assignCourier(externalShipmentId);
  const { scheduledAt } = await shippingProvider.requestPickup(externalShipmentId);

  const shipment = await Shipment.create({
    orderId: fulfillment.orderId,
    sellerId: fulfillment.sellerId,
    fulfillmentId: fulfillment._id,
    provider: env.SHIPPING_PROVIDER_MODE === 'real' ? 'shiprocket' : 'mock',
    externalOrderId,
    externalShipmentId,
    awbCode,
    courierName,
    status: 'PICKUP_SCHEDULED',
    pickupScheduledAt: scheduledAt,
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

  return shipment;
}

type ShipmentWebhookPayload = {
  eventId: string;
  externalShipmentId: string;
  status: keyof typeof STATUS_MAP;
  description?: string;
  signature: string;
};

/**
 * The shipment webhook is the source of truth for SHIPPED/DELIVERED —
 * mirrors the payment webhook's idempotency pattern (PaymentEvent's unique
 * eventId index -> ShipmentEvent's here).
 */
export async function handleShipmentWebhook(payload: ShipmentWebhookPayload) {
  const shipment = await Shipment.findOne({ externalShipmentId: payload.externalShipmentId });
  if (!shipment) {
    throw AppError.notFound('Unknown shipment', 'SHIPMENT_NOT_FOUND');
  }

  try {
    await ShipmentEvent.create({
      shipmentId: shipment._id,
      eventId: payload.eventId,
      status: payload.status,
      description: payload.description,
      rawPayload: payload,
      processed: false,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      return { duplicate: true };
    }
    throw err;
  }

  const signatureValid = shippingProvider.verifyWebhookSignature(JSON.stringify(payload), payload.signature);
  if (!signatureValid) {
    throw AppError.badRequest('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }

  const nextShipmentStatus = STATUS_MAP[payload.status];
  if (nextShipmentStatus && shipment.status !== nextShipmentStatus) {
    shipment.status = nextShipmentStatus;
    if (nextShipmentStatus === 'IN_TRANSIT' && !shipment.shippedAt) shipment.shippedAt = new Date();
    if (nextShipmentStatus === 'DELIVERED') shipment.deliveredAt = new Date();
    await shipment.save();

    if (nextShipmentStatus === 'IN_TRANSIT') {
      await applyExternalStatusUpdate(shipment.fulfillmentId.toString(), 'SHIPPED');
    } else if (nextShipmentStatus === 'DELIVERED') {
      await applyExternalStatusUpdate(shipment.fulfillmentId.toString(), 'DELIVERED');
    }
  }

  await ShipmentEvent.updateOne({ eventId: payload.eventId }, { processed: true });
  return { duplicate: false };
}

export async function simulateCourierWebhook(externalShipmentId: string, status: keyof typeof STATUS_MAP) {
  if (env.SHIPPING_PROVIDER_MODE !== 'mock') {
    throw AppError.forbidden('Shipping simulation is only available in mock mode', 'NOT_MOCK_MODE');
  }
  return handleShipmentWebhook({
    eventId: randomUUID(),
    externalShipmentId,
    status,
    signature: 'mock-shipping-signature',
  });
}

export async function getShipmentForFulfillment(fulfillmentId: string) {
  return Shipment.findOne({ fulfillmentId });
}
