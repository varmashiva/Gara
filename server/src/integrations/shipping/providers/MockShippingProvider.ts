import { randomUUID } from 'crypto';
import {
  ShippingProvider,
  CreateShipmentOrderParams,
  CreateShipmentOrderResult,
  AssignCourierResult,
  RequestPickupResult,
  TrackShipmentResult,
} from '../ShippingProvider';

/**
 * Local-dev/test provider — no real Shiprocket account needed. Deterministic
 * fake AWB/tracking data so the full fulfillment -> shipment -> tracking
 * flow can be exercised end to end without credentials.
 */
export class MockShippingProvider implements ShippingProvider {
  async createShipmentOrder(params: CreateShipmentOrderParams): Promise<CreateShipmentOrderResult> {
    return {
      externalOrderId: `mock_sr_order_${params.orderNumber}`,
      externalShipmentId: `mock_sr_shipment_${randomUUID().slice(0, 8)}`,
    };
  }

  async assignCourier(externalShipmentId: string): Promise<AssignCourierResult> {
    return {
      awbCode: `MOCKAWB${externalShipmentId.slice(-8).toUpperCase()}`,
      courierName: 'Mock Express Couriers',
    };
  }

  async requestPickup(): Promise<RequestPickupResult> {
    return { scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }

  async trackShipment(): Promise<TrackShipmentResult> {
    return { status: 'in_transit', events: [] };
  }

  async cancelShipment(): Promise<{ cancelled: boolean }> {
    return { cancelled: true };
  }

  verifyWebhookSignature(_rawBody: string, signatureHeader: string | undefined): boolean {
    return signatureHeader === 'mock-shipping-signature';
  }
}
