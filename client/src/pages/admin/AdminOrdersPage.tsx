import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminOrders, useAdminOrderSummary } from '@/features/admin/hooks';
import { formatPaise } from '@/utils/currency';

const STATUS_STYLES: Record<string, string> = {
  PAYMENT_PENDING: 'bg-surface-100 text-paper-300',
  PAID: 'bg-green-500/15 text-green-300',
  IN_PROGRESS: 'bg-yellow-500/15 text-yellow-600',
  PARTIALLY_SHIPPED: 'bg-yellow-500/15 text-yellow-600',
  SHIPPED: 'bg-blue-500/15 text-blue-300',
  DELIVERED: 'bg-green-500/15 text-green-300',
  COMPLETED: 'bg-green-500/15 text-green-300',
  PAYMENT_FAILED: 'bg-red-500/15 text-red-400',
  PAYMENT_EXPIRED: 'bg-red-500/15 text-red-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  RETURN_REQUESTED: 'bg-yellow-500/15 text-yellow-600',
  RETURN_APPROVED: 'bg-surface-100 text-paper-300',
  RETURN_REJECTED: 'bg-surface-100 text-paper-300',
  REFUNDED: 'bg-surface-100 text-paper-300',
};

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Payment pending', value: 'PAYMENT_PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function AdminOrdersPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: summary } = useAdminOrderSummary();
  const { data: orders, isLoading } = useAdminOrders(filter);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-paper-50/10 bg-surface-50 p-4">
          <p className="text-xs text-paper-400">Total orders</p>
          <p className="mt-1 text-2xl font-semibold text-paper-50">{summary?.totalOrders ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-paper-50/10 bg-surface-50 p-4">
          <p className="text-xs text-paper-400">Paid orders</p>
          <p className="mt-1 text-2xl font-semibold text-paper-50">{summary?.paidOrders ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-paper-50/10 bg-surface-50 p-4">
          <p className="text-xs text-paper-400">Revenue collected</p>
          <p className="mt-1 text-2xl font-semibold text-paper-50">
            {summary ? formatPaise(summary.totalRevenue) : '—'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === f.value ? 'bg-brand-600 text-white' : 'border border-paper-50/20 text-paper-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-paper-400">Loading...</p>}
      {!isLoading && (!orders || orders.length === 0) && <p className="text-paper-400">No orders found.</p>}

      <ul className="space-y-3">
        {orders?.map((order) => (
          <li key={order._id}>
            <Link
              to={`/admin/orders/${order._id}`}
              className="flex flex-col gap-2 rounded-lg border border-paper-50/10 bg-surface-50 p-4 hover:border-paper-50/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-paper-50">{order.orderNumber}</p>
                <p className="text-sm text-paper-400">
                  {order.customerId?.firstName ?? order.customerId?.username} · {order.customerId?.email}
                </p>
                <p className="text-xs text-paper-600">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.orderStatus] ?? 'bg-surface-100 text-paper-300'}`}>
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
                <p className="font-medium text-paper-50">{formatPaise(order.grandTotal)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
