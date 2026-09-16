import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders nothing if Google sign-in isn't configured (no VITE_GOOGLE_
 * CLIENT_ID) — this app runs fully on username/password without it, and a
 * misconfigured button is worse than no button.
 */
export function GoogleSignInButton({ redirectTo = '/' }: { redirectTo?: string }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    function tryRender() {
      if (cancelled) return;
      if (!window.google || !containerRef.current) {
        setTimeout(tryRender, 200);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            await loginWithGoogle(resp.credential);
            navigate(redirectTo);
          } catch {
            // AuthContext state is unchanged on failure; user stays on the
            // login/register page and can retry or use password auth.
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
      });
    }

    tryRender();
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, navigate, redirectTo]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
