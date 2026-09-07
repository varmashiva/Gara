import { useAuth } from '@/features/auth/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-700">Fresh, homemade food from local kitchens</h1>
      <p className="mt-2 text-gray-600">
        Phase 0 + Phase 1 scaffold is live: TypeScript React + Vite frontend talking to an Express +
        MongoDB backend with real JWT auth (access + rotating refresh tokens).
      </p>
      {user ? (
        <div className="mt-6 rounded-lg border border-orange-200 bg-white p-4">
          <p className="font-medium">You're signed in as {user.email}.</p>
          <p className="text-sm text-gray-500">Role: {user.role}</p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-orange-200 bg-white p-4">
          <p>Sign in or register to try the auth flow end to end.</p>
        </div>
      )}
    </div>
  );
}
