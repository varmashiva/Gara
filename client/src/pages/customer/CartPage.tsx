import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/features/cart/hooks';
import { formatPaise } from '@/utils/currency';
import { useAuth } from '@/features/auth/AuthContext';

export function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <p className="text-gray-500">Loading cart...</p>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link to="/products" className="mt-3 inline-block text-brand-600 underline">
          Browse products
        </Link>
      </div>
    );
  }

  const hasUnavailable = cart.items.some((item) => !item.available);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-2xl font-bold text-brand-700">Your Cart</h1>
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
          {cart.items.map((item) => (
            <li key={item.itemId} className="flex items-center gap-4 p-4">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-orange-50 text-2xl">🍽️</div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                {!item.available && <p className="text-sm text-red-600">{item.unavailableReason}</p>}
                <p className="text-sm text-gray-500">{formatPaise(item.unitPrice)} each</p>
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={item.quantity}
                onChange={(e) =>
                  updateItem.mutate({ itemId: item.itemId, quantity: Math.max(1, Number(e.target.value)) })
                }
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                aria-label={`Quantity for ${item.name}`}
              />
              <span className="w-24 text-right font-medium">{formatPaise(item.lineTotal)}</span>
              <button
                onClick={() => removeItem.mutate(item.itemId)}
                className="text-sm text-red-600 underline"
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatPaise(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Delivery fee</dt>
            <dd>{formatPaise(cart.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPaise(cart.grandTotal)}</dd>
          </div>
        </dl>
        {hasUnavailable && (
          <p className="mt-3 text-sm text-red-600">
            Remove unavailable items before checking out.
          </p>
        )}
        <button
          onClick={() => (user ? navigate('/checkout') : navigate('/login'))}
          disabled={hasUnavailable}
          className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
