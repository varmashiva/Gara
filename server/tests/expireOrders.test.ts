import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { Product } from '../src/models/Product';
import { Order } from '../src/models/Order';
import { expireStaleOrders } from '../src/jobs/expireOrders.job';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

describe('expireStaleOrders', () => {
  it('releases inventory and marks a stale PAYMENT_PENDING order as PAYMENT_EXPIRED', async () => {
    const sellerId = new mongoose.Types.ObjectId();
    const product = await Product.create({
      sellerId,
      categoryId: new mongoose.Types.ObjectId(),
      categorySnapshot: { name: 'Test', slug: 'test' },
      name: 'Test Product',
      slug: `test-${new mongoose.Types.ObjectId()}`,
      description: 'x',
      price: 10000,
      isVeg: true,
      status: 'APPROVED',
      inventory: { availableStock: 5, reservedStock: 3, lowStockThreshold: 5 },
    });

    const order = await Order.create({
      orderNumber: `ORD-TEST-${Date.now()}`,
      customerId: new mongoose.Types.ObjectId(),
      items: [
        {
          productId: product._id,
          sellerId,
          productName: product.name,
          unitPrice: 10000,
          quantity: 3,
          subtotal: 30000,
        },
      ],
      shippingAddressSnapshot: {
        fullName: 'A',
        phone: '9000000000',
        addressLine1: 'x',
        city: 'x',
        state: 'x',
        postalCode: '1',
        country: 'IN',
      },
      subtotal: 30000,
      deliveryFee: 4900,
      grandTotal: 34900,
      paymentStatus: 'PENDING',
      orderStatus: 'PAYMENT_PENDING',
      paymentExpiresAt: new Date(Date.now() - 60 * 1000), // already expired
    });

    const count = await expireStaleOrders();
    expect(count).toBe(1);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder!.orderStatus).toBe('PAYMENT_EXPIRED');
    expect(updatedOrder!.paymentStatus).toBe('FAILED');

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct!.inventory.availableStock).toBe(8); // 5 + 3 released
    expect(updatedProduct!.inventory.reservedStock).toBe(0);
  });

  it('does not touch orders whose paymentExpiresAt has not passed yet', async () => {
    await Order.create({
      orderNumber: `ORD-TEST-${Date.now()}`,
      customerId: new mongoose.Types.ObjectId(),
      items: [],
      shippingAddressSnapshot: {
        fullName: 'A',
        phone: '9000000000',
        addressLine1: 'x',
        city: 'x',
        state: 'x',
        postalCode: '1',
        country: 'IN',
      },
      subtotal: 0,
      deliveryFee: 4900,
      grandTotal: 4900,
      paymentStatus: 'PENDING',
      orderStatus: 'PAYMENT_PENDING',
      paymentExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // future
    });

    const count = await expireStaleOrders();
    expect(count).toBe(0);
  });
});
