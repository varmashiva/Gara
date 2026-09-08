import { Outlet, Link } from 'react-router-dom';

export function SellerLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-orange-100 pb-3">
        <h1 className="text-xl font-bold text-brand-700">Seller Dashboard</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/seller/products" className="text-gray-700 hover:text-brand-700">
            Products
          </Link>
          <Link to="/seller/fulfillments" className="text-gray-700 hover:text-brand-700">
            Orders
          </Link>
          <Link to="/seller/earnings" className="text-gray-700 hover:text-brand-700">
            Earnings
          </Link>
          <Link to="/" className="text-brand-600 underline">
            Back to marketplace
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
