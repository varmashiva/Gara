import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrder } from '@/features/orders/hooks';
import { createPaymentOrder, simulatePaymentComplete } from '@/features/orders/api';
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
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, refetch } = useOrder(id);
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [providerOrderId, setProviderOrderId] = useState<string | null>(null);

  if (isLoading) return <p className="text-gray-500">Loading order...</p>;
  if (!order) return <p className="text-red-600">Order not found.</p>;

  async function handleStartPayment() {
    setPayError(null);
    setPaying(true);
    try {
      const payment = await createPaymentOrder(order!._id);
      setProviderOrderId(payment.providerOrderId);
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? 'Could not start payment.');
    } finally {
      setPaying(false);
    }
  }

  async function handleSimulate(status: 'captured' | 'failed') {
    if (!providerOrderId) return;
    setPaying(true);
    setPayError(null);
    try {
      await simulatePaymentComplete(providerOrderId, status);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? 'Could not complete payment.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-brand-700">Order {order.orderNumber}</h1>
      <p className="mb-6 text-sm text-gray-500">
        Placed {new Date(order.createdAt).toLocaleString()} · Status:{' '}
        <span className="font-medium text-gray-800">{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
      </p>

      <ul className="mb-6 divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between p-4 text-sm">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span className="font-medium">{formatPaise(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mb-6 space-y-2 rounded-lg border border-gray-100 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Subtotal</dt>
          <dd>{formatPaise(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600">Delivery fee</dt>
          <dd>{formatPaise(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatPaise(order.grandTotal)}</dd>
        </div>
      </dl>

      {order.orderStatus === 'PAYMENT_PENDING' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="mb-3 text-sm text-gray-700">
            This order is awaiting payment. In production this would open the Razorpay checkout — since this app is
            running in mock payment mode locally, use the buttons below to simulate the gateway calling our webhook.
          </p>
          {!providerOrderId ? (
            <button
              onClick={handleStartPayment}
              disabled={paying}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {paying ? 'Starting...' : 'Pay Now'}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleSimulate('captured')}
                disabled={paying}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Simulate payment success
              </button>
              <button
                onClick={() => handleSimulate('failed')}
                disabled={paying}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Simulate payment failure
              </button>
            </div>
          )}
          {payError && <p className="mt-2 text-sm text-red-600">{payError}</p>}
        </div>
      )}

      {order.orderStatus === 'PAID' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Payment confirmed. Your order has been sent to the seller for preparation.
        </div>
      )}
    </div>
  );
}
