import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrderTracking } from '@/features/orders/hooks';
import { createPaymentOrder, simulatePaymentComplete } from '@/features/orders/api';
import { formatPaise } from '@/utils/currency';
import { loadRazorpayCheckoutScript } from '@/utils/razorpay';
import { useAuth } from '@/features/auth/AuthContext';

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

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useOrderTracking(id);
  const order = data?.order;
  const fulfillments = data?.fulfillments ?? [];
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [providerOrderId, setProviderOrderId] = useState<string | null>(null);

  // While Razorpay's popup reports success client-side, the order is only
  // actually marked paid once our webhook verifies it server-side (Rule 9,
  // see payment.service.ts) — so after checkout "succeeds" we poll briefly
  // instead of trusting the popup's callback directly.
  useEffect(() => {
    if (!confirming) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const result = await refetch();
      const status = result.data?.order.orderStatus;
      if (status && status !== 'PAYMENT_PENDING') {
        setConfirming(false);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      } else if (attempts >= 15) {
        setConfirming(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [confirming, refetch, queryClient]);

  if (isLoading) return <p className="text-paper-600">Loading order...</p>;
  if (!order) return <p className="text-brand-300">Order not found.</p>;

  async function handleStartPayment() {
    setPayError(null);
    setPaying(true);
    try {
      const payment = await createPaymentOrder(order!._id);

      if (payment.provider === 'razorpay' && payment.keyId) {
        await loadRazorpayCheckoutScript();
        if (!window.Razorpay) throw new Error('Razorpay checkout failed to load.');

        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: 'INR',
          name: 'Gara',
          description: `Order ${order!.orderNumber}`,
          order_id: payment.providerOrderId,
          prefill: {
            name: order!.shippingAddressSnapshot.fullName,
            email: user?.email,
            contact: order!.shippingAddressSnapshot.phone,
          },
          theme: { color: '#6B1019' },
          handler: () => {
            setConfirming(true);
          },
          modal: {
            ondismiss: () => setPaying(false),
          },
        });
        rzp.on('payment.failed', (resp) => {
          setPayError(resp.error?.description ?? 'Payment failed. Please try again.');
          setPaying(false);
        });
        rzp.open();
        setPaying(false);
      } else {
        // Mock mode only — no real gateway involved, see below.
        setProviderOrderId(payment.providerOrderId);
        setPaying(false);
      }
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? 'Could not start payment.');
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
      <h1 className="mb-1 font-display text-2xl font-semibold text-paper-50">Order {order.orderNumber}</h1>
      <p className="mb-6 text-sm text-paper-600">
        Placed {new Date(order.createdAt).toLocaleString()} · Status:{' '}
        <span className="font-medium text-paper-200">{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</span>
      </p>

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
          <dt className="text-paper-400">Delivery fee</dt>
          <dd>{formatPaise(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold text-paper-50">
          <dt>Total</dt>
          <dd>{formatPaise(order.grandTotal)}</dd>
        </div>
      </dl>

      {order.orderStatus === 'PAYMENT_PENDING' && (
        <div className="mb-6 rounded-xl2 border border-accent-500/30 bg-accent-400/10 p-4">
          {confirming ? (
            <p className="text-sm text-paper-200">Confirming your payment with the bank... this usually takes a few seconds.</p>
          ) : !providerOrderId ? (
            <>
              <p className="mb-3 text-sm text-paper-200">This order is awaiting payment.</p>
              <button
                onClick={handleStartPayment}
                disabled={paying}
                className="btn-pill-primary !px-5 !py-2.5 disabled:opacity-50"
              >
                {paying ? 'Starting...' : 'Pay Now'}
              </button>
            </>
          ) : (
            <div>
              <p className="mb-3 text-sm text-paper-200">
                Running in local mock payment mode — use the buttons below to simulate the gateway calling our webhook.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSimulate('captured')}
                  disabled={paying}
                  className="btn-pill bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Simulate payment success
                </button>
                <button
                  onClick={() => handleSimulate('failed')}
                  disabled={paying}
                  className="btn-pill bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Simulate payment failure
                </button>
              </div>
            </div>
          )}
          {payError && <p className="mt-2 text-sm text-brand-300">{payError}</p>}
        </div>
      )}

      {order.orderStatus === 'PAID' && fulfillments.length > 0 && (
        <div className="mb-6 rounded-xl2 border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          Payment confirmed. Your order has been sent to the kitchen for preparation.
        </div>
      )}

      {fulfillments.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-lg font-semibold text-paper-50">Tracking</h2>
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
