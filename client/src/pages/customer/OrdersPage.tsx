import { Link } from 'react-router-dom';
import { useOrders } from '@/features/orders/hooks';
import { formatPaise } from '@/utils/currency';

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) return <p className="text-gray-500">Loading orders...</p>;
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
        <p className="text-gray-600">You haven't placed any orders yet.</p>
        <Link to="/products" className="mt-3 inline-block text-brand-600 underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-700">Your Orders</h1>
      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
        {orders.map((order) => (
          <li key={order._id}>
            <Link to={`/orders/${order._id}`} className="flex items-center justify-between p-4 hover:bg-orange-50">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPaise(order.grandTotal)}</p>
                <p className="text-sm text-gray-500">{order.orderStatus}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
