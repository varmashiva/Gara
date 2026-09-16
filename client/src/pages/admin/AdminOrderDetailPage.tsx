import { Link, useParams } from 'react-router-dom';
import { useAdminOrder } from '@/features/admin/hooks';
import { formatPaise } from '@/utils/currency';

const STATUS_LABELS: Record<string, string> = {
  PAYMENT_PENDING: 'Awaiting payment',
  PAID: 'Paid',
  IN_PROGRESS: 'Being prepared',
  PARTIALLY_SHIPPED: 'Partially shipped',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_EXPIRED: 'Payment expired',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return requested',
  RETURN_APPROVED: 'Return approved',
  RETURN_REJECTED: 'Return rejected',
  REFUNDED: 'Refunded',
};

const FULFILLMENT_LABELS: Record<string, string> = {
  PENDING: 'Order received',
  CONFIRMED: 'Order confirmed',
  PROCESSING: 'Being prepared',
  READY_TO_SHIP: 'Ready to ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminOrder(id);
  const order = data?.order;
  const fulfillments = data?.fulfillments ?? [];

  if (isLoading) return <p className="text-paper-400">Loading order...</p>;
  if (!order) return <p className="text-brand-300">Order not found.</p>;

  const address = order.shippingAddressSnapshot;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/admin/orders" className="mb-4 inline-block text-sm text-paper-400 hover:text-paper-200">
        ← Back to orders
      </Link>

      <h1 className="mb-1 font-display text-2xl font-semibold text-paper-50">Order {order.orderNumber}</h1>
      <p className="mb-6 text-sm text-paper-600">
        Placed {new Date(order.createdAt).toLocaleString()} · Status:{' '}
        <span className="font-medium text-paper-200">{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
      </p>

      <div className="card mb-6 p-4 text-sm">
        <h2 className="mb-2 font-display text-base font-semibold text-paper-50">Customer</h2>
        <p className="text-paper-200">{order.customerId?.firstName ?? order.customerId?.username}</p>
        <p className="text-paper-400">{order.customerId?.email}</p>
      </div>

      <div className="card mb-6 p-4 text-sm">
        <h2 className="mb-2 font-display text-base font-semibold text-paper-50">Shipping to</h2>
        <p className="text-paper-200">{address.fullName} · {address.phone}</p>
        <p className="text-paper-400">
          {address.addressLine1}
          {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state}{' '}
          {address.postalCode}, {address.country}
        </p>
      </div>

      <ul className="card mb-6 divide-y divide-paper-50/10">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between p-4 text-sm text-paper-200">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span className="font-medium text-paper-50">{formatPaise(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="card mb-6 space-y-2 p-4 text-sm text-paper-200">
        <div className="flex justify-between">
          <dt className="text-paper-400">Subtotal</dt>
          <dd>{formatPaise(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-paper-400">Discount</dt>
          <dd>-{formatPaise(order.discountTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-paper-400">Delivery fee</dt>
          <dd>{formatPaise(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-paper-50">
          <dt>Total</dt>
          <dd>{formatPaise(order.grandTotal)}</dd>
        </div>
        <div className="flex justify-between text-xs text-paper-600">
          <dt>Payment status</dt>
          <dd>{order.paymentStatus}</dd>
        </div>
      </dl>

      {fulfillments.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold text-paper-50">Fulfillment</h2>
          <ul className="space-y-3">
            {fulfillments.map((f) => (
              <li key={f._id} className="card p-4 text-sm">
                <p className="mb-1 font-medium text-paper-50">{FULFILLMENT_LABELS[f.status] ?? f.status}</p>
                <p className="text-paper-600">
                  {f.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
