import { Link } from 'react-router-dom';
import { useOrders } from '@/features/orders/hooks';
import { formatPaise } from '@/utils/currency';

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <p className="text-paper-600">Loading orders...</p>;
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-paper-50/20 p-10 text-center">
        <p className="text-paper-400">You haven't placed any orders yet.</p>
        <Link to="/products" className="btn-pill-primary mt-4 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-semibold text-paper-50">Your Orders</h1>
      <ul className="card divide-y divide-paper-50/10">
        {orders.map((order) => (
          <li key={order._id}>
            <Link to={`/orders/${order._id}`} className="flex items-center justify-between p-4 hover:bg-surface-100">
              <div>
                <p className="font-medium text-paper-50">{order.orderNumber}</p>
                <p className="text-sm text-paper-600">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-paper-50">{formatPaise(order.grandTotal)}</p>
                <p className="text-sm text-paper-600">{order.orderStatus}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
