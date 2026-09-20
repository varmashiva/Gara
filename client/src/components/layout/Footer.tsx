import { Link } from 'react-router-dom';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';

const LOCATIONS = [
  {
    label: 'Tadepalligudem',
    address: '534101',
  },
  {
    label: 'Bengaluru',
    address: '560100',
  },
];

export function Footer() {
  return (
    <footer id="footer" className="mt-16 bg-surface-950 text-white/80 sm:mt-24">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center">
              <img src="/logo/gara-wordmark-white.png" alt="Gara" className="h-8 w-auto" />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Homemade pickles, sweets, and snacks, made in real kitchens and delivered to your door.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-400">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link to="/products" className="hover:text-accent-400">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-accent-400">
                  Your cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-accent-400">
                  Track an order
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-400">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <a href="tel:+916281776748" className="flex items-center gap-2 hover:text-accent-400">
                  <Phone size={14} className="shrink-0 text-white/50" />
                  +91 62817 76748
                </a>
              </li>
              <li>
                <a
                  href="mailto:Contact.garafoods@gmail.com"
                  className="flex items-center gap-2 hover:text-accent-400"
                >
                  <Mail size={14} className="shrink-0 text-white/50" />
                  Contact.garafoods@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href="#"
                aria-label="Website"
                className="rounded-full border border-white/20 p-2 hover:border-accent-400 hover:text-accent-400"
              >
                <Globe size={16} />
              </a>
              <a
                href="https://www.instagram.com/thegarafoods/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-white/20 p-2 transition hover:border-accent-400 hover:opacity-75"
              >
                <img src="https://cdn.simpleicons.org/instagram/ffffff" alt="" className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/916281776748"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-white/20 p-2 transition hover:border-accent-400 hover:opacity-75"
              >
                <img src="https://cdn.simpleicons.org/whatsapp/ffffff" alt="" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-400">Our Kitchens</h3>
            <ul className="mt-4 space-y-4 text-sm text-white/70">
              {LOCATIONS.map((loc) => (
                <li key={loc.label} className="flex gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-white/50" />
                  <span>
                    <span className="block font-medium text-white/90">{loc.label}</span>
                    {loc.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <span>© 2024 Gara. All rights reserved.</span>
          <span>Made with a smirk, for home kitchens everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
