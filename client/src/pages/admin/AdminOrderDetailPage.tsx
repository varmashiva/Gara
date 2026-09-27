import { Link, useParams } from 'react-router-dom';
import { useAdminOrder, useSimulateShipmentStatus, useUpdateFulfillmentStatus } from '@/features/admin/hooks';
import { NEXT_STATUS } from '@/types/fulfillment';
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

const ACTION_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirm',
  PROCESSING: 'Start preparing',
  READY_TO_SHIP: 'Ship with Shiprocket',
  CANCELLED: 'Cancel',
  FAILED: 'Mark failed',
};

const SHIPMENT_LABELS: Record<string, string> = {
  CREATED: 'Shiprocket order created — courier not assigned yet',
  AWB_ASSIGNED: 'Courier assigned — pickup not scheduled yet',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery failed / returned',
};

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateFulfillmentStatus(id);
  const simulate = useSimulateShipmentStatus(id);
  const actionError =
    (updateStatus.error as any)?.response?.data?.message ?? (simulate.error as any)?.response?.data?.message;
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
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
          <ul className="space-y-3">
            {fulfillments.map((f) => {
              const shipment = f.shipmentId;
              const pending = updateStatus.isPending && updateStatus.variables?.id === f._id;
              // A PROCESSING fulfillment with a shipment means a previous
              // "Ship" attempt stopped part-way — clicking again resumes it.
              const resuming = f.status === 'PROCESSING' && !!shipment;
              return (
                <li key={f._id} className="card p-4 text-sm">
                  <p className="mb-1 font-medium text-paper-50">{FULFILLMENT_LABELS[f.status] ?? f.status}</p>
                  <p className="text-paper-600">
                    {f.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                  </p>

                  {shipment && (
                    <div className="mt-3 space-y-1 border-t border-paper-50/10 pt-3 text-paper-400">
                      <p className="text-paper-200">{SHIPMENT_LABELS[shipment.status] ?? shipment.status}</p>
                      {shipment.awbCode && (
                        <p>
                          {shipment.courierName} · AWB <span className="font-mono text-paper-200">{shipment.awbCode}</span>
                        </p>
                      )}
                      {shipment.pickupScheduledAt && (
                        <p>Pickup on {new Date(shipment.pickupScheduledAt).toLocaleString()}</p>
                      )}
                      {shipment.trackingUrl && (
                        <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-brand-300 underline">
                          Track shipment
                        </a>
                      )}
                    </div>
                  )}

                  {(NEXT_STATUS[f.status as keyof typeof NEXT_STATUS] ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {NEXT_STATUS[f.status as keyof typeof NEXT_STATUS]!.map((next) => (
                        <button
                          key={next}
                          disabled={pending}
                          onClick={() => updateStatus.mutate({ id: f._id, status: next })}
                          className={
                            next === 'CANCELLED' || next === 'FAILED'
                              ? 'rounded-md border border-paper-50/20 px-3 py-1.5 text-xs font-medium text-paper-300 disabled:opacity-60'
                              : 'rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60'
                          }
                        >
                          {pending && updateStatus.variables?.status === next
                            ? 'Working...'
                            : next === 'READY_TO_SHIP' && resuming
                              ? 'Retry shipping'
                              : ACTION_LABELS[next] ?? next}
                        </button>
                      ))}
                    </div>
                  )}

                  {shipment?.provider === 'mock' && (shipment.status === 'PICKUP_SCHEDULED' || shipment.status === 'IN_TRANSIT') && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-paper-600">
                      <span>Mock courier:</span>
                      {(['picked_up', 'delivered', 'failed'] as const).map((status) => (
                        <button
                          key={status}
                          disabled={simulate.isPending}
                          onClick={() => simulate.mutate({ externalShipmentId: shipment.externalShipmentId, status })}
                          className="rounded-md border border-paper-50/20 px-2 py-1 disabled:opacity-60"
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
