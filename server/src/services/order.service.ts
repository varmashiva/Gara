import mongoose from 'mongoose';
import { Order, OrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { Cart } from '../models/Cart';
import { Address } from '../models/Address';
import { AppError } from '../utils/errors';
import { generateOrderNumber } from '../utils/orderNumber';
import { reserveInventoryInSession, releaseInventoryInSession } from './inventoryReservation.service';
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
