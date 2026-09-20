import { Outlet, Link } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-paper-50/15 pb-3">
        <h1 className="text-xl font-bold text-brand-300">Admin Dashboard</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/admin/orders" className="text-paper-300 hover:text-brand-300">
            Orders
          </Link>
          <Link to="/admin/hero" className="text-paper-300 hover:text-brand-300">
            Home content
          </Link>
          <Link to="/admin/categories" className="text-paper-300 hover:text-brand-300">
            Categories
          </Link>
          <Link to="/admin/products" className="text-paper-300 hover:text-brand-300">
            Products
          </Link>
          <Link to="/admin/returns" className="text-paper-300 hover:text-brand-300">
            Returns
          </Link>
          <Link to="/admin/coupons" className="text-paper-300 hover:text-brand-300">
            Coupons
          </Link>
          <Link to="/admin/settlements" className="text-paper-300 hover:text-brand-300">
            Settlements
          </Link>
          <Link to="/" className="text-brand-300 underline">
            Back to marketplace
          </Link>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
