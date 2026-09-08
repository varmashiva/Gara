import { Order } from '../models/Order';
import { failOrExpireOrder } from '../services/order.service';
import { logger } from '../utils/logger';

/**
 * Finds every order still PAYMENT_PENDING past its paymentExpiresAt and
 * releases its inventory reservation. failOrExpireOrder is idempotent
 * (no-ops if the order already left PAYMENT_PENDING via a late webhook),
 * so running this repeatedly on the same stale order is safe.
 */
export async function expireStaleOrders(): Promise<number> {
  const stale = await Order.find({
    orderStatus: 'PAYMENT_PENDING',
    paymentExpiresAt: { $lt: new Date() },
  }).select('_id');

  for (const order of stale) {
    try {
      await failOrExpireOrder((order._id as { toString(): string }).toString(), 'PAYMENT_EXPIRED');
    } catch (err) {
      logger.error('Failed to expire stale order', {
        orderId: order.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (stale.length > 0) {
    logger.info('Expired stale unpaid orders', { count: stale.length });
  }

  return stale.length;
}
