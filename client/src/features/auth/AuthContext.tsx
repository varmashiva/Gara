import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken } from '@/api/axios';
import { loginRequest, logoutRequest, meRequest, registerRequest, googleLoginRequest, PublicUser } from '@/api/endpoints';

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Attempt silent refresh on load so a returning user (with a valid
    // refresh cookie) doesn't have to log in again.
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const me = await meRequest();
      setUser(me);
      // useCart() fires its own query on mount in parallel with this
      // bootstrap — on a fresh page load that request goes out before the
      // access token above is restored, so the server treats it as a
      // guest and hands back an empty cart, which react-query then caches
      // as if it were the real one. Now that we know a token exists,
      // force a refetch so it picks up the actual signed-in cart.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { user, accessToken } = await loginRequest({ email, password });
    setAccessToken(accessToken);
    setUser(user);
  }

  async function register(payload: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const { user, accessToken } = await registerRequest(payload);
    setAccessToken(accessToken);
    setUser(user);
  }

  async function loginWithGoogle(idToken: string) {
    const { user, accessToken } = await googleLoginRequest(idToken);
    setAccessToken(accessToken);
    setUser(user);
  }

  async function logout() {
    await logoutRequest();
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
