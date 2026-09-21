import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '@/features/cart/hooks';
import { formatPaise } from '@/utils/currency';
import { useAuth } from '@/features/auth/AuthContext';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';
import type { CartItem } from '@/types/cart';

// Local draft, committed onBlur/Enter instead of mutating on every
// keystroke — item.quantity comes from a server round-trip, so a
// controlled input bound straight to it fights whatever the user is
// mid-typing (clearing the field to retype snaps back to 1, and a slow
// response can overwrite a later keystroke). Not tracked while focused,
// so a quantity update arriving from elsewhere doesn't yank the field
// out from under an in-progress edit.
function QuantityInput({ item, onCommit }: { item: CartItem; onCommit: (quantity: number) => void }) {
  const [draft, setDraft] = useState(String(item.quantity));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(item.quantity));
  }, [item.quantity, focused]);

  function commit() {
    const parsed = Math.min(50, Math.max(1, Math.trunc(Number(draft)) || 1));
    setDraft(String(parsed));
    if (parsed !== item.quantity) onCommit(parsed);
  }

  return (
    <input
      type="number"
      min={1}
      max={50}
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="input w-16 !py-1.5 text-center"
      aria-label={`Quantity for ${item.name}`}
    />
  );
}

export function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <p className="text-paper-600">Loading cart...</p>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-paper-50/20 p-10 text-center">
        <p className="text-paper-400">Your cart is empty.</p>
        <Link to="/products" className="btn-pill-primary mt-4 inline-flex">
          Browse products
        </Link>
      </div>
    );
  }

  const hasUnavailable = cart.items.some((item) => !item.available);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 font-display text-2xl font-semibold text-paper-50">Your Cart</h1>
        <ul className="card divide-y divide-paper-50/10">
          {cart.items.map((item) => (
            <li key={item.itemId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-1 items-center gap-4">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="h-16 w-16 shrink-0 rounded-lg" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-paper-50">{item.name}</p>
                  {!item.available && <p className="text-sm text-brand-300">{item.unavailableReason}</p>}
                  <p className="text-sm text-paper-600">{formatPaise(item.unitPrice)} each</p>
                </div>
                <span className="font-medium text-paper-50 sm:hidden">{formatPaise(item.lineTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <QuantityInput
                  item={item}
                  onCommit={(quantity) => updateItem.mutate({ itemId: item.itemId, quantity })}
                />
                <span className="hidden w-24 text-right font-medium text-paper-50 sm:inline">
                  {formatPaise(item.lineTotal)}
                </span>
                <button
                  onClick={() => removeItem.mutate(item.itemId)}
                  className="text-sm font-medium text-brand-300 hover:text-brand-300"
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper-50">Order Summary</h2>
        <dl className="space-y-2 text-sm text-paper-200">
          <div className="flex justify-between">
            <dt className="text-paper-400">Subtotal</dt>
            <dd>{formatPaise(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-paper-400">Delivery fee</dt>
            <dd>{formatPaise(cart.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-paper-50/10 pt-2 text-base font-semibold text-paper-50">
            <dt>Total</dt>
            <dd>{formatPaise(cart.grandTotal)}</dd>
          </div>
        </dl>
        {hasUnavailable && (
          <p className="mt-3 text-sm text-brand-300">
            Remove unavailable items before checking out.
          </p>
        )}
        <button
          onClick={() => (user ? navigate('/checkout') : navigate('/login'))}
          disabled={hasUnavailable}
          className="btn-pill-primary mt-4 w-full disabled:opacity-50"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
