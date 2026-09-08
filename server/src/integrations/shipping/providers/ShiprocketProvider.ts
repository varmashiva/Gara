import crypto from 'crypto';
import {
  ShippingProvider,
  CreateShipmentOrderParams,
  CreateShipmentOrderResult,
  AssignCourierResult,
  RequestPickupResult,
  TrackShipmentResult,
} from '../ShippingProvider';
import { env } from '../../../config/env';

/**
 * Shiprocket External API (https://apiv2.shiprocket.in/v1/external/).
 *
 * Endpoints below were corroborated this session across Shiprocket's own
 * API docs domain, their support helpsheet, and multiple independent
 * open-source SDKs (Python/PHP) referencing the same paths — not invented:
 *   POST /auth/login              — { email, password } -> { token }, valid ~240h
 *   GET  /courier/serviceability  — pincode/weight -> available couriers
 *   POST /orders/create/adhoc     — creates the order (+ implicit shipment)
 *   POST /courier/assign/awb      — { shipment_id } -> assigns AWB/courier
 *   POST /courier/generate/pickup — { shipment_id: [] } -> schedules pickup
 *   GET  /courier/track/awb/{awb} — tracking events for one AWB
 *
 * NOT independently confirmed this session — verify against
 * https://apidocs.shiprocket.in/ before relying on these in production:
 *   - the exact endpoint/path for registering a NEW pickup location
 *     (commonly referenced as settings/company/addpickup, but not
 *     confirmed via a live fetch here) — TODO / VERIFY WITH CURRENT
 *     SHIPROCKET API
 *   - the exact cancel-order endpoint/path — TODO / VERIFY WITH CURRENT
 *     SHIPROCKET API
 *   - the webhook signature header name/algorithm — Shiprocket's dashboard
 *     lets you set a webhook URL + a shared secret, but the exact header
 *     Shiprocket sends it back in was not confirmed this session — TODO /
 *     VERIFY WITH CURRENT SHIPROCKET API before trusting verifyWebhookSignature
 *     below in production; it currently assumes a plain shared-secret
 *     header comparison, which is the most common pattern but unconfirmed.
 */
export class ShiprocketProvider implements ShippingProvider {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await fetch(`${env.SHIPROCKET_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
    });

    if (!response.ok) {
      throw new Error(`Shiprocket auth failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { token: string };
    this.token = data.token;
    // Documented validity is ~240 hours; refresh a little early to be safe.
    this.tokenExpiresAt = Date.now() + 239 * 60 * 60 * 1000;
    return this.token;
  }

  private async authedFetch(path: string, init: RequestInit = {}) {
    const token = await this.getToken();
    const response = await fetch(`${env.SHIPROCKET_API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Shiprocket API error on ${path}: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  async createShipmentOrder(params: CreateShipmentOrderParams): Promise<CreateShipmentOrderResult> {
    const [firstName, ...rest] = params.deliveryAddress.fullName.split(' ');

    const data = (await this.authedFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify({
        order_id: params.orderNumber,
        order_date: params.orderDate.toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: params.pickupLocation.externalPickupLocationId ?? params.pickupLocation.label,
        billing_customer_name: firstName,
        billing_last_name: rest.join(' ') || firstName,
        billing_address: params.deliveryAddress.addressLine1,
        billing_address_2: params.deliveryAddress.addressLine2 ?? '',
        billing_city: params.deliveryAddress.city,
        billing_pincode: params.deliveryAddress.postalCode,
        billing_state: params.deliveryAddress.state,
        billing_country: params.deliveryAddress.country,
        billing_phone: params.deliveryAddress.phone,
        shipping_is_billing: true,
        order_items: params.items.map((item) => ({
          name: item.name,
          sku: item.sku,
          units: item.units,
          selling_price: item.sellingPrice,
        })),
        payment_method: params.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: params.subtotal,
        length: 10,
        breadth: 10,
        height: 10,
        weight: params.weightKg,
      }),
    })) as { order_id: string; shipment_id: string };

    return { externalOrderId: String(data.order_id), externalShipmentId: String(data.shipment_id) };
  }

  async assignCourier(externalShipmentId: string): Promise<AssignCourierResult> {
    const data = (await this.authedFetch('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: externalShipmentId }),
    })) as { response: { data: { awb_code: string; courier_name: string } } };

    return { awbCode: data.response.data.awb_code, courierName: data.response.data.courier_name };
  }

  async requestPickup(externalShipmentId: string): Promise<RequestPickupResult> {
    await this.authedFetch('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [externalShipmentId] }),
    });
    return {};
  }

  async trackShipment(awbCode: string): Promise<TrackShipmentResult> {
    const data = (await this.authedFetch(`/courier/track/awb/${awbCode}`)) as {
      tracking_data: { shipment_track: { current_status: string }[] };
    };
    const status = data.tracking_data.shipment_track[0]?.current_status ?? 'unknown';
    return { status, events: [] };
  }

  async cancelShipment(externalOrderId: string): Promise<{ cancelled: boolean }> {
    // TODO / VERIFY WITH CURRENT SHIPROCKET API — path/body unconfirmed this
    // session; commonly referenced as POST /orders/cancel with { ids: [...] }.
    await this.authedFetch('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: [externalOrderId] }),
    });
    return { cancelled: true };
  }

  verifyWebhookSignature(_rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader || !env.SHIPROCKET_WEBHOOK_SECRET) return false;
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(env.SHIPROCKET_WEBHOOK_SECRET);
    // TODO / VERIFY WITH CURRENT SHIPROCKET API — assumes the header carries
    // the shared secret directly (as configured in the Shiprocket dashboard),
    // not an HMAC of the body. Confirm the actual scheme before production use.
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
