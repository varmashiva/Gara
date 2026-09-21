import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { Seo } from '@/components/common/Seo';

const queryClient = new QueryClient();

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            {/* Site-wide default — rendered on every route, deeper below
                overrides it (Helmet's designed precedence: later-in-tree
                wins for singular tags). Pages without their own <Seo />
                (login, cart, etc.) fall back to this instead of getting
                no meta tags at all. index.html only keeps the handful of
                truly static things (favicons, fonts, Organization JSON-LD)
                — a duplicate of these lived there and in Helmet's output
                until now, since Helmet can only ever replace tags it
                rendered itself, never ones already in the static HTML. */}
            <Seo
              title="Gara"
              description="Gara brings you homemade pickles, sweets, and snacks made in real kitchens, in small batches, delivered fresh to your door."
            />
            <ScrollToTop />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
