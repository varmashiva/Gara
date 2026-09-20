import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/hooks';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloatingButton } from '@/components/layout/WhatsAppFloatingButton';

export function MainLayout() {
  const { user, logout, loading } = useAuth();
  const { data: cart } = useCart();
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-paper-50/10 bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center">
            <img src="/logo/gara-wordmark.png" alt="Gara" className="h-8 w-auto sm:h-9" />
          </Link>

          <div className="hidden items-center gap-5 text-sm font-medium text-paper-200 md:flex">
            <Link to="/products" className="hover:text-brand-300">
              Menu
            </Link>
            <Link to="/cart" className="relative flex items-center hover:text-brand-300">
              <ShoppingCart size={20} aria-label="Cart" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            {loading ? null : user ? (
              <>
                <Link to="/orders" className="hover:text-brand-300">
                  Orders
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin/products" className="hover:text-brand-300">
                    Admin Dashboard
                  </Link>
                )}
                <NotificationBell />
                <span className="hidden text-paper-400 lg:inline">Hi, {user.firstName}</span>
                <button onClick={() => logout()} className="btn-pill-outline !px-4 !py-2">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-brand-300">
                  Sign in
                </Link>
                <Link to="/register" className="btn-pill-primary !px-4 !py-2">
                  Join Gara
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative flex items-center text-paper-200" aria-label="Cart">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-paper-50/15 text-paper-200"
            >
              {menuOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-paper-50/10 px-4 pb-6 pt-4 sm:px-6 md:hidden">
            <div className="flex flex-col gap-1 text-sm font-medium text-paper-200">
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-surface-100 hover:text-brand-300"
              >
                Menu
              </Link>
              {loading ? null : user ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-surface-100 hover:text-brand-300"
                  >
                    Orders
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin/products"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2.5 hover:bg-surface-100 hover:text-brand-300"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-paper-50/10 px-3 pt-4">
                    <span className="text-paper-400">Hi, {user.firstName}</span>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="btn-pill-outline !px-4 !py-2"
                    >
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-2 flex flex-col gap-3 border-t border-paper-50/10 pt-4">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-surface-100 hover:text-brand-300"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn-pill-primary justify-center"
                  >
                    Join Gara
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
