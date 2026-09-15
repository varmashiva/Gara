import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddresses } from '@/features/orders/hooks';
import { useCart } from '@/features/cart/hooks';
import { createOrder } from '@/features/orders/api';
import { previewCoupon } from '@/features/coupons/api';
import { formatPaise } from '@/utils/currency';
import { AddressForm } from '@/components/checkout/AddressForm';
import type { Address } from '@/types/order';

export function CheckoutPage() {
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const { data: cart, isLoading: loadingCart } = useCart();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressFormTarget, setAddressFormTarget] = useState<'new' | Address | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?._id ?? addresses[0]._id);
    }
  }, [addresses, selectedAddressId]);

  if (loadingAddresses || loadingCart) return <p className="text-paper-600">Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return <p className="text-paper-400">Your cart is empty. Add something before checking out.</p>;
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    setCouponChecking(true);
    try {
      const { discount } = await previewCoupon(code);
      setAppliedCoupon({ code, discount });
      setCouponInput('');
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.response?.data?.message ?? 'That coupon could not be applied.');
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) return;
    setError(null);
    setPlacing(true);
    try {
      const order = await createOrder(selectedAddressId, appliedCoupon?.code);
      navigate(`/orders/${order._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 font-display text-2xl font-semibold text-paper-50">Checkout</h1>

        <h2 className="mb-2 text-lg font-semibold text-paper-50">Delivery address</h2>
        {addresses && addresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr._id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl2 border p-3 transition ${
                  selectedAddressId === addr._id ? 'border-brand-400 bg-brand-500/15' : 'border-paper-50/15'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr._id}
                  onChange={() => setSelectedAddressId(addr._id)}
                  className="mt-1 accent-brand-500"
                />
                <span className="flex-1 text-sm text-paper-200">
                  <span className="font-medium text-paper-50">{addr.fullName}</span> ({addr.phone})
                  <br />
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAddressFormTarget(addr);
                  }}
                  className="shrink-0 text-xs font-semibold text-brand-300 hover:text-brand-200"
                >
                  Edit
                </button>
              </label>
            ))}
          </div>
        )}

        {addressFormTarget === null ? (
          <button
            onClick={() => setAddressFormTarget('new')}
            className="text-sm font-semibold text-brand-300 hover:text-brand-200"
          >
            + Add a new address
          </button>
        ) : (
          <div className="card p-4">
            <AddressForm
              address={addressFormTarget === 'new' ? undefined : addressFormTarget}
              onDone={() => setAddressFormTarget(null)}
            />
            <button
              type="button"
              onClick={() => setAddressFormTarget(null)}
              className="mt-3 text-sm font-medium text-paper-400 hover:text-paper-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-paper-50">Order Summary</h2>
        <ul className="mb-3 space-y-1 text-sm text-paper-400">
          {cart.items.map((item) => (
            <li key={item.itemId} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPaise(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-paper-50/10 pt-3">
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-sm">
              <span className="font-medium text-paper-50">{appliedCoupon.code} applied</span>
              <button type="button" onClick={handleRemoveCoupon} className="font-medium text-brand-300 hover:text-brand-200">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                className="input flex-1 !py-2 text-sm uppercase placeholder:normal-case"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponChecking || !couponInput.trim()}
                className="btn-pill-outline !px-4 !py-2 text-sm disabled:opacity-50"
              >
                {couponChecking ? 'Checking...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && <p className="mt-2 text-sm text-brand-300">{couponError}</p>}
        </div>
        <dl className="mt-3 space-y-2 border-t border-paper-50/10 pt-3 text-sm text-paper-200">
          <div className="flex justify-between">
            <dt className="text-paper-400">Subtotal</dt>
            <dd>{formatPaise(cart.subtotal)}</dd>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-400">
              <dt>Coupon discount</dt>
              <dd>−{formatPaise(appliedCoupon.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-paper-400">Delivery fee</dt>
            <dd>{formatPaise(cart.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold text-paper-50">
            <dt>Total</dt>
            <dd>{formatPaise(cart.grandTotal - (appliedCoupon?.discount ?? 0))}</dd>
          </div>
        </dl>
        {error && <p className="mt-2 text-sm text-brand-300">{error}</p>}
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddressId || placing}
          className="btn-pill-primary mt-4 w-full disabled:opacity-50"
        >
          {placing ? 'Placing order...' : 'Place order'}
        </button>
      </div>
    </div>
  );
}
