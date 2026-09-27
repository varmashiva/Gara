import crypto from 'crypto';
import {
  ShippingProvider,
  CreateShipmentOrderParams,
  CreateShipmentOrderResult,
  AssignCourierResult,
  RequestPickupResult,
  TrackShipmentResult,
  PickupLocationInfo,
  RegisterPickupLocationResult,
} from '../ShippingProvider';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/errors';

/**
 * Shiprocket External API (https://apiv2.shiprocket.in/v1/external/).
 *
 * Endpoints used (paths cross-checked against Shiprocket's API docs and the
 * seshac/laravel-shiprocket-api SDK):
 *   POST /auth/login                 — { email, password } -> { token }, valid ~240h
 *   POST /settings/company/addpickup — registers a pickup address under a
 *                                      unique nickname (`pickup_location`)
 *   POST /orders/create/adhoc        — creates the order (+ implicit shipment)
 *   POST /courier/assign/awb         — { shipment_id } -> assigns AWB/courier
 *   POST /courier/generate/pickup    — { shipment_id: [] } -> schedules pickup
 *   GET  /courier/track/awb/{awb}    — tracking events for one AWB
 *   POST /orders/cancel              — { ids: [sr_order_id] }
 *
 * Webhooks: Shiprocket (Settings > API > Webhooks) POSTs tracking updates to
 * our URL and echoes the token configured there in the `x-api-key` header —
 * a shared secret, not an HMAC of the body. Note Shiprocket rejects webhook
 * URLs containing "shiprocket", "kartrocket", "sr" or "kr".
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
      console.error('Shiprocket auth failed', response.status, await response.text());
      throw AppError.badRequest('Could not log in to Shiprocket — check the API user credentials', 'SHIPROCKET_AUTH_FAILED');
    }

    const data = (await response.json()) as { token: string };
    this.token = data.token;
    // Documented validity is ~240 hours; refresh a little early to be safe.
    this.tokenExpiresAt = Date.now() + 239 * 60 * 60 * 1000;
    return this.token;
  }

  private async authedFetch(path: string, init: RequestInit = {}, retried = false): Promise<unknown> {
    const token = await this.getToken();
    const response = await fetch(`${env.SHIPROCKET_API_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Token revoked/expired early (e.g. the API user's password was changed)
    // — log in again once before giving up.
    if (response.status === 401 && !retried) {
      this.token = null;
      return this.authedFetch(path, init, true);
    }

    const text = await response.text();
    let body: Record<string, unknown> = {};
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      // Non-JSON (e.g. an HTML gateway error page) — fall through to the status check.
    }
    if (!response.ok) {
      console.error(`Shiprocket API error on ${path}`, response.status, text);
      throw AppError.badRequest(`Shiprocket: ${describeError(body) ?? `request failed (${response.status})`}`, 'SHIPROCKET_API_ERROR');
    }
    return body;
  }

  async registerPickupLocation(info: PickupLocationInfo & { email: string }): Promise<RegisterPickupLocationResult> {
    // The nickname is how every later order refers to this address, and it
    // must be unique within the Shiprocket account (max 36 chars).
    const nickname = `${info.label.replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, 28)}-${crypto.randomBytes(3).toString('hex')}`;

    await this.authedFetch('/settings/company/addpickup', {
      method: 'POST',
      body: JSON.stringify({
        pickup_location: nickname,
        name: info.contactPerson,
        email: info.email,
        phone: info.phone,
        address: info.addressLine1,
        address_2: info.addressLine2 ?? '',
        city: info.city,
        state: info.state,
        country: info.country,
        pin_code: info.postalCode,
      }),
    });

    return { externalPickupLocationId: nickname };
  }

  async createShipmentOrder(params: CreateShipmentOrderParams): Promise<CreateShipmentOrderResult> {
    const [firstName, ...rest] = params.deliveryAddress.fullName.trim().split(/\s+/);

    const data = (await this.authedFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify({
        order_id: params.orderNumber,
        order_date: params.orderDate.toISOString().slice(0, 19).replace('T', ' '),
        pickup_location: params.pickupLocation.externalPickupLocationId ?? params.pickupLocation.label,
        billing_customer_name: firstName,
        billing_last_name: rest.join(' '),
        billing_address: params.deliveryAddress.addressLine1,
        billing_address_2: params.deliveryAddress.addressLine2 ?? '',
        billing_city: params.deliveryAddress.city,
        billing_pincode: params.deliveryAddress.postalCode,
        billing_state: params.deliveryAddress.state,
        billing_country: params.deliveryAddress.country,
        billing_email: params.customerEmail ?? '',
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
    })) as { order_id?: number | string; shipment_id?: number | string; message?: string };

    if (!data.order_id || !data.shipment_id) {
      throw AppError.badRequest(`Shiprocket: ${data.message ?? 'order was not created'}`, 'SHIPROCKET_API_ERROR');
    }
    return { externalOrderId: String(data.order_id), externalShipmentId: String(data.shipment_id) };
  }

  async assignCourier(externalShipmentId: string): Promise<AssignCourierResult> {
    // Shiprocket answers 200 even when no courier could be assigned (e.g. an
    // unserviceable pincode or low wallet balance) — awb_assign_status tells.
    const data = (await this.authedFetch('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: externalShipmentId }),
    })) as {
      awb_assign_status?: number;
      message?: string;
      response?: { data?: { awb_code?: string; courier_name?: string; awb_assign_error?: string } };
    };

    const awb = data.response?.data;
    if (!awb?.awb_code) {
      const reason = awb?.awb_assign_error ?? data.message ?? 'no courier could be assigned';
      throw AppError.badRequest(`Shiprocket: ${reason}`, 'SHIPROCKET_AWB_FAILED');
    }
    return { awbCode: awb.awb_code, courierName: awb.courier_name ?? '' };
  }

  async requestPickup(externalShipmentId: string): Promise<RequestPickupResult> {
    const data = (await this.authedFetch('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [externalShipmentId] }),
    })) as { response?: { pickup_scheduled_date?: string } };

    const scheduled = data.response?.pickup_scheduled_date;
    const scheduledAt = scheduled ? new Date(scheduled.replace(' ', 'T') + '+05:30') : undefined;
    return { scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined };
  }

  async trackShipment(awbCode: string): Promise<TrackShipmentResult> {
    const data = (await this.authedFetch(`/courier/track/awb/${encodeURIComponent(awbCode)}`)) as {
      tracking_data?: { shipment_track?: { current_status?: string }[] };
    };
    const status = data.tracking_data?.shipment_track?.[0]?.current_status ?? 'unknown';
    return { status, events: [] };
  }

  async cancelShipment(externalOrderId: string): Promise<{ cancelled: boolean }> {
    await this.authedFetch('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: [Number(externalOrderId)] }),
    });
    return { cancelled: true };
  }

  verifyWebhookToken(tokenHeader: string | undefined): boolean {
    if (!tokenHeader || !env.SHIPROCKET_WEBHOOK_SECRET) return false;
    const a = Buffer.from(tokenHeader);
    const b = Buffer.from(env.SHIPROCKET_WEBHOOK_SECRET);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}

/** Shiprocket's error bodies are either { message } or { errors: { field: [msg] } }. */
function describeError(body: Record<string, unknown>): string | undefined {
  const errors = body.errors as Record<string, string[] | string> | undefined;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (first) return Array.isArray(first) ? first[0] : first;
  }
  return typeof body.message === 'string' ? body.message : undefined;
}
