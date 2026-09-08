import { Outlet, Link } from 'react-router-dom';

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-orange-100 pb-3">
        <h1 className="text-xl font-bold text-brand-700">Admin Dashboard</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/admin/applications" className="text-gray-700 hover:text-brand-700">
            Seller Applications
          </Link>
          <Link to="/admin/products" className="text-gray-700 hover:text-brand-700">
            Products
          </Link>
          <Link to="/admin/returns" className="text-gray-700 hover:text-brand-700">
            Returns
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
