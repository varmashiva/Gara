import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export function MainLayout() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-orange-100 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold text-brand-700">
            🍲 Homemade Marketplace
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {loading ? null : user ? (
              <>
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
