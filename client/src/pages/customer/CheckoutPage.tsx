import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddresses } from '@/features/orders/hooks';
import { useCart } from '@/features/cart/hooks';
import { createOrder } from '@/features/orders/api';
import { formatPaise } from '@/utils/currency';
import { AddressForm } from '@/components/checkout/AddressForm';

export function CheckoutPage() {
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const { data: cart, isLoading: loadingCart } = useCart();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?._id ?? addresses[0]._id);
    }
  }, [addresses, selectedAddressId]);

  if (loadingAddresses || loadingCart) return <p className="text-gray-500">Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return <p className="text-gray-600">Your cart is empty. Add something before checking out.</p>;
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) return;
    setError(null);
    setPlacing(true);
    try {
      const order = await createOrder(selectedAddressId);
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
        <h1 className="mb-4 text-2xl font-bold text-brand-700">Checkout</h1>

        <h2 className="mb-2 text-lg font-semibold">Delivery address</h2>
        {addresses && addresses.length > 0 && (
          <div className="mb-4 space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr._id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  selectedAddressId === addr._id ? 'border-brand-500 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr._id}
                  onChange={() => setSelectedAddressId(addr._id)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium">{addr.fullName}</span> ({addr.phone})
                  <br />
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                </span>
              </label>
            ))}
          </div>
        )}

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="text-sm text-brand-600 underline">
            + Add a new address
          </button>
        ) : (
          <div className="rounded-lg border border-gray-200 p-4">
            <AddressForm onCreated={() => setShowAddForm(false)} />
          </div>
        )}
      </div>

      <div className="h-fit rounded-lg border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        <ul className="mb-3 space-y-1 text-sm text-gray-600">
          {cart.items.map((item) => (
            <li key={item.itemId} className="flex justify-between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPaise(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-gray-100 pt-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatPaise(cart.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Delivery fee</dt>
            <dd>{formatPaise(cart.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPaise(cart.grandTotal)}</dd>
          </div>
        </dl>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddressId || placing}
          className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {placing ? 'Placing order...' : 'Place order'}
        </button>
      </div>
    </div>
  );
}
