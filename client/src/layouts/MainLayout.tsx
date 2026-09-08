import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/hooks';

export function MainLayout() {
  const { user, logout, loading } = useAuth();
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-orange-100 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold text-brand-700">
            🍲 Homemade Marketplace
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/products" className="text-gray-700 hover:text-brand-700">
              Products
            </Link>
            <Link to="/cart" className="relative text-gray-700 hover:text-brand-700">
              Cart
              {itemCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            {loading ? null : user ? (
              <>
                <Link to="/orders" className="text-gray-700 hover:text-brand-700">
                  Orders
                </Link>
                {user.role === 'SELLER' && (
                  <Link to="/seller/fulfillments" className="text-gray-700 hover:text-brand-700">
                    Seller Dashboard
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin/applications" className="text-gray-700 hover:text-brand-700">
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-gray-600">
                  Hi, {user.firstName} ({user.role})
                </span>
                <button onClick={() => logout()} className="text-brand-600 underline">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-brand-600 underline">
                  Sign in
                </Link>
                <Link to="/register" className="text-brand-600 underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
