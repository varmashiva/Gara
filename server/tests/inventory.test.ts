import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { Product } from '../src/models/Product';
import { reserveInventory, commitInventory, releaseInventory } from '../src/services/inventoryReservation.service';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

async function makeProduct(overrides: Partial<{ availableStock: number; reservedStock: number }> = {}) {
  return Product.create({
    sellerId: new mongoose.Types.ObjectId(),
    categoryId: new mongoose.Types.ObjectId(),
    categorySnapshot: { name: 'Test', slug: 'test' },
    name: 'Test Pickle',
    slug: `test-pickle-${new mongoose.Types.ObjectId().toString()}`,
    description: 'x',
    price: 10000,
    isVeg: true,
    status: 'APPROVED',
    inventory: {
      availableStock: overrides.availableStock ?? 10,
      reservedStock: overrides.reservedStock ?? 0,
      lowStockThreshold: 5,
    },
  });
}

describe('inventory reservation', () => {
  it('reserves stock by decrementing availableStock and incrementing reservedStock', async () => {
    const product = await makeProduct({ availableStock: 10 });

    await reserveInventory([{ productId: product.id, quantity: 3 }]);

    const updated = await Product.findById(product.id);
    expect(updated!.inventory.availableStock).toBe(7);
    expect(updated!.inventory.reservedStock).toBe(3);
  });

  it('rejects reservation when stock is insufficient, leaving stock unchanged', async () => {
    const product = await makeProduct({ availableStock: 2 });

    await expect(reserveInventory([{ productId: product.id, quantity: 5 }])).rejects.toThrow(
      'Insufficient stock'
    );

    const updated = await Product.findById(product.id);
    expect(updated!.inventory.availableStock).toBe(2);
    expect(updated!.inventory.reservedStock).toBe(0);
  });

  it('prevents overselling under concurrent reservation of the last unit', async () => {
    const product = await makeProduct({ availableStock: 1 });

    const results = await Promise.allSettled([
      reserveInventory([{ productId: product.id, quantity: 1 }]),
      reserveInventory([{ productId: product.id, quantity: 1 }]),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const updated = await Product.findById(product.id);
    expect(updated!.inventory.availableStock).toBe(0);
    expect(updated!.inventory.reservedStock).toBe(1);
  });

  it('rolls back ALL reservations in a multi-item order if any single item fails', async () => {
    const plentiful = await makeProduct({ availableStock: 10 });
    const scarce = await makeProduct({ availableStock: 1 });

    await expect(
      reserveInventory([
        { productId: plentiful.id, quantity: 5 },
        { productId: scarce.id, quantity: 5 }, // insufficient
      ])
    ).rejects.toThrow('Insufficient stock');

    const plentifulAfter = await Product.findById(plentiful.id);
    // The first item's reservation must have been rolled back by the
    // transaction even though its own check-and-decrement succeeded.
    expect(plentifulAfter!.inventory.availableStock).toBe(10);
    expect(plentifulAfter!.inventory.reservedStock).toBe(0);
  });

  it('commit clears the reservation hold without touching availableStock again', async () => {
    const product = await makeProduct({ availableStock: 10 });
    await reserveInventory([{ productId: product.id, quantity: 4 }]);

    await commitInventory([{ productId: product.id, quantity: 4 }]);

    const updated = await Product.findById(product.id);
    expect(updated!.inventory.availableStock).toBe(6); // unchanged from reserve time
    expect(updated!.inventory.reservedStock).toBe(0);
  });

  it('release gives the stock back on payment failure/expiry/cancellation', async () => {
    const product = await makeProduct({ availableStock: 10 });
    await reserveInventory([{ productId: product.id, quantity: 4 }]);

    await releaseInventory([{ productId: product.id, quantity: 4 }]);

    const updated = await Product.findById(product.id);
    expect(updated!.inventory.availableStock).toBe(10);
    expect(updated!.inventory.reservedStock).toBe(0);
  });

  it('reserves against a specific variant independently of the base product stock', async () => {
    const product = await makeProduct({ availableStock: 999 });
    product.variants.push({
      sku: 'SKU-500G',
      name: '500g pack',
      packSize: '500g',
      price: 29900,
      availableStock: 3,
      reservedStock: 0,
      lowStockThreshold: 1,
      images: [],
      status: 'ACTIVE',
    });
    await product.save();
    const variantId = product.variants[0]._id!.toString();

    await reserveInventory([{ productId: product.id, variantId, quantity: 2 }]);

    const updated = await Product.findById(product.id);
    expect(updated!.variants[0].availableStock).toBe(1);
    expect(updated!.variants[0].reservedStock).toBe(2);
    expect(updated!.inventory.availableStock).toBe(999); // base stock untouched
  });
});
