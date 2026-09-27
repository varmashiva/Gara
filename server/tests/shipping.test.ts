import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { Order } from '../src/models/Order';
import { Seller } from '../src/models/Seller';
import { SellerFulfillment } from '../src/models/SellerFulfillment';
import { SellerPickupLocation } from '../src/models/SellerPickupLocation';
import { Shipment } from '../src/models/Shipment';
import { shippingProvider } from '../src/integrations/shipping/shippingProviderFactory';
import { createShipmentForFulfillment, handleShiprocketWebhook } from '../src/services/shipping.service';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await clearTestDb();
});

async function seedReadyFulfillment() {
  const seller = await Seller.create({
    userId: new mongoose.Types.ObjectId(),
    storeName: 'Gara Kitchen',
    storeSlug: `gara-${new mongoose.Types.ObjectId()}`,
    commissionRate: 0,
  });
  await SellerPickupLocation.create({
    sellerId: seller._id,
    label: 'Main Kitchen',
    contactPerson: 'Cook',
    phone: '9000000000',
    addressLine1: '12-3, Temple Street',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500001',
    country: 'India',
    isDefault: true,
  });
  const productId = new mongoose.Types.ObjectId();
  const order = await Order.create({
    orderNumber: `ORD-TEST-${Date.now()}`,
    customerId: new mongoose.Types.ObjectId(),
    items: [{ productId, sellerId: seller._id, productName: 'Pickle', unitPrice: 20000, quantity: 2, subtotal: 40000 }],
    shippingAddressSnapshot: {
      fullName: 'Asha Rao',
      phone: '9000000001',
      addressLine1: '1 Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    subtotal: 40000,
    deliveryFee: 4900,
    grandTotal: 44900,
    paymentStatus: 'SUCCESS',
    orderStatus: 'IN_PROGRESS',
  });
  const fulfillment = await SellerFulfillment.create({
    orderId: order._id,
    sellerId: seller._id,
    items: [{ productId, productName: 'Pickle', unitPrice: 20000, quantity: 2, subtotal: 40000 }],
    status: 'PROCESSING',
  });
  return { fulfillment };
}

describe('createShipmentForFulfillment', () => {
  it('registers an unregistered pickup location and schedules pickup', async () => {
    const { fulfillment } = await seedReadyFulfillment();

    const shipment = await createShipmentForFulfillment(fulfillment);

    expect(shipment.status).toBe('PICKUP_SCHEDULED');
    expect(shipment.awbCode).toBeTruthy();
    const location = await SellerPickupLocation.findOne({ sellerId: fulfillment.sellerId });
    expect(location!.status).toBe('ACTIVE');
    expect(location!.shiprocketPickupLocationId).toBe('mock-Main Kitchen');
  });

  it('resumes after a failed AWB assignment without creating a second Shiprocket order', async () => {
    const { fulfillment } = await seedReadyFulfillment();
    const createSpy = jest.spyOn(shippingProvider, 'createShipmentOrder');
    jest.spyOn(shippingProvider, 'assignCourier').mockRejectedValueOnce(new Error('pincode not serviceable'));

    await expect(createShipmentForFulfillment(fulfillment)).rejects.toThrow('pincode not serviceable');
    expect((await Shipment.findOne({ fulfillmentId: fulfillment._id }))!.status).toBe('CREATED');

    const shipment = await createShipmentForFulfillment(fulfillment);
    expect(shipment.status).toBe('PICKUP_SCHEDULED');
    expect(createSpy).toHaveBeenCalledTimes(1);
  });
});

describe('handleShiprocketWebhook', () => {
  async function shippedFulfillment() {
    const { fulfillment } = await seedReadyFulfillment();
    const shipment = await createShipmentForFulfillment(fulfillment);
    fulfillment.status = 'READY_TO_SHIP';
    await fulfillment.save();
    return { fulfillment, awb: shipment.awbCode! };
  }

  it('rejects calls without the configured token', async () => {
    await expect(handleShiprocketWebhook({ awb: 'X', current_status: 'DELIVERED' }, 'wrong')).rejects.toThrow(
      'Invalid webhook token'
    );
  });

  it('acknowledges unknown AWBs without failing', async () => {
    const result = await handleShiprocketWebhook({ awb: 'UNKNOWN', current_status: 'IN TRANSIT' }, 'mock-shipping-signature');
    expect(result).toEqual({ ignored: true });
  });

  it('moves the fulfillment through SHIPPED to DELIVERED and ignores duplicates and stale events', async () => {
    const { fulfillment, awb } = await shippedFulfillment();
    const delivered = { awb, current_status: 'DELIVERED', current_status_id: 7, current_timestamp: '23 05 2026 11:43:52' };

    expect(await handleShiprocketWebhook(delivered, 'mock-shipping-signature')).toEqual({ duplicate: false });
    expect(await handleShiprocketWebhook(delivered, 'mock-shipping-signature')).toEqual({ duplicate: true });

    // A late IN TRANSIT event must not move a delivered shipment backwards.
    await handleShiprocketWebhook(
      { awb, current_status: 'IN TRANSIT', current_status_id: 18, current_timestamp: '22 05 2026 09:00:00' },
      'mock-shipping-signature'
    );

    const shipment = await Shipment.findOne({ awbCode: awb });
    expect(shipment!.status).toBe('DELIVERED');
    const updated = await SellerFulfillment.findById(fulfillment._id);
    expect(updated!.status).toBe('DELIVERED');
    expect(updated!.statusHistory.map((h) => h.status)).toEqual(['SHIPPED', 'DELIVERED']);
  });
});
