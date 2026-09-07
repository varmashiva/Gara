import mongoose from 'mongoose';
import { Order, OrderItem, OrderDocument } from '../models/Order';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';
import { Address } from '../models/Address';
import { SellerFulfillment } from '../models/SellerFulfillment';
import { AppError } from '../utils/errors';
import { generateOrderNumber } from '../utils/orderNumber';
import {
  reserveInventoryInSession,
  releaseInventoryInSession,
  commitInventoryInSession,
} from './inventoryReservation.service';
import { getCart } from './cart.service';
import { FLAT_DELIVERY_FEE } from '../config/pricing';
import { env } from '../config/env';

/**
 * Checkout: re-fetches every product fresh (never trusts the cart's
 * priceSnapshot or the client), reserves inventory, and creates the Order
 * document in ONE transaction — either all of that happens or none of it
 * does, so a mid-checkout failure can never leave stock reserved for an
 * order that was never created.
 */
export async function createOrder(userId: string, addressId: string) {
  const cartView = await getCart({ userId });
  if (cartView.items.length === 0) {
    throw AppError.badRequest('Your cart is empty', 'CART_EMPTY');
  }
  if (cartView.items.some((item) => !item.available)) {
    throw AppError.conflict(
      'Some items in your cart are no longer available — please review your cart',
      'CART_HAS_UNAVAILABLE_ITEMS'
    );
  }

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw AppError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
  }

  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      const orderItems: OrderItem[] = [];
      const reservationItems = [];

      for (const cartItem of cartView.items) {
        const product = await Product.findOne({
          _id: cartItem.productId,
          status: 'APPROVED',
          isDeleted: false,
        }).session(session);

        if (!product) {
          throw AppError.conflict(`Product ${cartItem.name} is no longer available`, 'PRODUCT_UNAVAILABLE');
        }

        const variant = cartItem.variantId
          ? product.variants.find((v) => v._id?.toString() === cartItem.variantId)
          : undefined;

        if (cartItem.variantId && (!variant || variant.status !== 'ACTIVE')) {
          throw AppError.conflict(`Product ${cartItem.name} variant is no longer available`, 'VARIANT_UNAVAILABLE');
        }

        const unitPrice = variant ? variant.price : Math.round(product.price * (1 - product.discountPercent / 100));

        orderItems.push({
          productId: product._id as OrderItem['productId'],
          variantId: variant?._id as OrderItem['variantId'],
          sellerId: product.sellerId as OrderItem['sellerId'],
          productName: product.name,
          variantName: variant?.name,
          sku: variant?.sku,
          unitPrice,
          quantity: cartItem.quantity,
          subtotal: unitPrice * cartItem.quantity,
        });

        reservationItems.push({
          productId: (product._id as mongoose.Types.ObjectId).toString(),
          variantId: variant?._id?.toString(),
          quantity: cartItem.quantity,
        });
      }

      // Reserve stock for every item in the SAME transaction as the order
      // write below — see inventoryReservation.service for why.
      await reserveInventoryInSession(reservationItems, session);

      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const deliveryFee = FLAT_DELIVERY_FEE;
      const grandTotal = subtotal + deliveryFee;

      const [created] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            customerId: userId,
            items: orderItems,
            shippingAddressSnapshot: {
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            },
            subtotal,
            discountTotal: 0,
            deliveryFee,
            grandTotal,
            paymentStatus: 'PENDING',
            orderStatus: 'PAYMENT_PENDING',
            paymentExpiresAt: new Date(Date.now() + env.PAYMENT_TIMEOUT_MINUTES * 60 * 1000),
          },
        ],
        { session }
      );
      order = created;

      await Cart.updateOne({ userId }, { items: [] }, { session });
    });

    return order;
  } finally {
    await session.endSession();
  }
}

export async function listMyOrders(userId: string) {
  return Order.find({ customerId: userId }).sort({ createdAt: -1 });
}

export async function getMyOrder(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, customerId: userId });
  if (!order) {
    throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }
  return order;
}

/**
 * Pre-payment cancellation only — once an order is PAID, cancellation has
 * to coordinate with seller fulfillment and possibly a refund, which
 * belongs to the fulfillment/returns phases, not here.
 */
export async function cancelUnpaidOrder(userId: string, orderId: string) {
  const order = await getMyOrder(userId, orderId);
  if (order.orderStatus !== 'PAYMENT_PENDING') {
    throw AppError.conflict('Only an unpaid order can be cancelled this way', 'INVALID_ORDER_STATE');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await releaseInventoryInSession(
        order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId?.toString(),
          quantity: item.quantity,
        })),
        session
      );
      order.orderStatus = 'CANCELLED';
      order.cancelledAt = new Date();
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return order;
}

function itemsToReservationList(order: OrderDocument) {
  return order.items.map((item) => ({
    productId: item.productId.toString(),
    variantId: item.variantId?.toString(),
    quantity: item.quantity,
  }));
}

/**
 * Called only from payment.service after the payment webhook (the source
 * of truth) confirms success. Idempotent at the order level: if the order
 * is no longer PAYMENT_PENDING (e.g. a second webhook event for the same
 * logical payment slipped past PaymentEvent's own dedup), this is a no-op
 * rather than double-committing inventory or creating duplicate
 * fulfillments.
 */
export async function confirmPayment(orderId: string) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.orderStatus !== 'PAYMENT_PENDING') {
        return;
      }

      await commitInventoryInSession(itemsToReservationList(order), session);

      const itemsBySeller = new Map<string, typeof order.items>();
      for (const item of order.items) {
        const key = item.sellerId.toString();
        if (!itemsBySeller.has(key)) itemsBySeller.set(key, [] as unknown as typeof order.items);
        itemsBySeller.get(key)!.push(item);
      }

      const fulfillmentIds: mongoose.Types.ObjectId[] = [];
      for (const [sellerId, items] of itemsBySeller) {
        const [fulfillment] = await SellerFulfillment.create(
          [
            {
              orderId: order._id,
              sellerId,
              items: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                variantName: item.variantName,
                sku: item.sku,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
              })),
              status: 'PENDING',
              statusHistory: [{ status: 'PENDING', at: new Date() }],
            },
          ],
          { session }
        );
        fulfillmentIds.push(fulfillment._id as mongoose.Types.ObjectId);
      }

      order.paymentStatus = 'SUCCESS';
      order.orderStatus = 'PAID';
      order.paidAt = new Date();
      order.sellerFulfillmentIds = fulfillmentIds;
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

/**
 * Called from payment.service when the gateway reports failure, or from
 * the (future) expiry job when paymentExpiresAt has passed. Idempotent for
 * the same reason as confirmPayment above.
 */
export async function failOrExpireOrder(orderId: string, reason: 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED') {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.orderStatus !== 'PAYMENT_PENDING') {
        return;
      }

      await releaseInventoryInSession(itemsToReservationList(order), session);

      order.paymentStatus = 'FAILED';
      order.orderStatus = reason;
      if (reason === 'PAYMENT_EXPIRED') order.expiresAt = new Date();
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }
}

export async function getOrderForPayment(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }
  return order;
}

/**
 * Derives the order-level status from all of its SellerFulfillments. Only
 * runs once the order has left PAYMENT_PENDING — cancellation/payment
 * failure/expiry are handled elsewhere and never overwritten here.
 */
export async function recomputeOrderStatus(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) return;
  if (!['PAID', 'IN_PROGRESS', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.orderStatus)) {
    return;
  }

  const fulfillments = await SellerFulfillment.find({ orderId });
  if (fulfillments.length === 0) return;

  const active = fulfillments.filter((f) => f.status !== 'CANCELLED' && f.status !== 'FAILED');
  if (active.length === 0) {
    // Every seller's slice was cancelled/failed — nothing left to fulfill.
    order.orderStatus = 'CANCELLED';
    order.cancelledAt = new Date();
    await order.save();
    return;
  }

  const allDelivered = active.every((f) => f.status === 'DELIVERED');
  const allShippedOrBeyond = active.every((f) => f.status === 'SHIPPED' || f.status === 'DELIVERED');
  const someShippedOrBeyond = active.some((f) => f.status === 'SHIPPED' || f.status === 'DELIVERED');

  let next: OrderDocument['orderStatus'];
  if (allDelivered) next = 'COMPLETED';
  else if (allShippedOrBeyond) next = 'SHIPPED';
  else if (someShippedOrBeyond) next = 'PARTIALLY_SHIPPED';
  else next = 'IN_PROGRESS';

  if (order.orderStatus !== next) {
    order.orderStatus = next;
    if (next === 'COMPLETED') order.completedAt = new Date();
    await order.save();
  }
}

export async function getOrderTracking(userId: string, orderId: string) {
  const order = await getMyOrder(userId, orderId);
  const fulfillments = await SellerFulfillment.find({ orderId: order._id }).select(
    'sellerId status items statusHistory'
  );
  return { order, fulfillments };
}
