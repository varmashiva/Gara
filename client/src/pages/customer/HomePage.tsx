import { Link } from 'react-router-dom';
import { Check, ArrowUpRight } from 'lucide-react';
import { useProducts, useCategories } from '@/features/products/hooks';
import { useHeroBanner } from '@/features/hero/hooks';
import { useHomeHighlight } from '@/features/homeHighlights/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { Seo } from '@/components/common/Seo';

const DEFAULT_HERO_IMAGE = 'https://images.pexels.com/photos/19151506/pexels-photo-19151506.jpeg?auto=compress&cs=tinysrgb&w=1200';

const DEFAULT_HIGHLIGHT_ITEMS = [
  { icon: '🌿', label: 'Small-batch & fresh' },
  { icon: '🚚', label: 'Delivered near you' },
];

const QUALITY_POINTS = ['Made fresh to order', 'Checked before it ships', 'No preservatives added'];

const TESTIMONIALS = [
  {
    quote:
      'The mango pickle tastes exactly like my grandmother used to make. I have stopped buying it from stores.',
    name: 'Ananya Rao',
    place: 'Bengaluru',
  },
  {
    quote: 'Ordered the motichoor laddu for a family function and everyone asked where I got them.',
    name: 'Kunal Mehta',
    place: 'Pune',
  },
  {
    quote: 'The lemon pickle has become a weekly order in our house. Never tasted this fresh from a store.',
    name: 'Divya Iyer',
    place: 'Chennai',
  },
];

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
      <span className="mr-1 font-normal text-brand-300">(</span>
      {children}
      <span className="ml-1 font-normal text-brand-300">)</span>
    </p>
  );
}

export function HomePage() {
  const { data } = useProducts({ page: 1, limit: 8, sort: 'newest' });
  const { data: categories } = useCategories();
  const { data: hero } = useHeroBanner();
  const { data: highlight } = useHomeHighlight();
  const highlightItems = highlight?.items.length ? highlight.items : DEFAULT_HIGHLIGHT_ITEMS;

  return (
    <div className="flex flex-col gap-12 sm:gap-20 md:gap-24">
      <Seo
        title="Gara"
        description="Gara brings you homemade pickles, sweets, and snacks made in real kitchens, in small batches, delivered fresh to your door."
      />
      <div className="grid overflow-hidden rounded-xl2 shadow-[0_1px_2px_rgba(61,10,17,0.04),0_24px_48px_-16px_rgba(61,10,17,0.25)] md:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 bg-surface-950 p-6 sm:gap-10 sm:p-8 md:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
              <span className="mr-1 font-normal text-white/50">(</span>
              {hero?.eyebrow ?? 'Serving since day one'}
              <span className="ml-1 font-normal text-white/50">)</span>
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] text-white sm:mt-5 sm:text-4xl sm:leading-[1.05] md:text-5xl">
              {hero?.headline ?? 'Something worth craving, made at home'}
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/70 sm:mt-5 sm:text-base">
              {hero?.subtext ??
                'Gara brings you pickles, sweets, and snacks made the way they were always meant to be made, in real kitchens, in small batches.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={hero?.ctaLink ?? '/products'}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90 sm:px-6 sm:py-3"
            >
              {hero?.ctaText ?? 'Browse the menu'}
            </Link>
            <Link
              to={hero?.ctaLink ?? '/products'}
              aria-label={hero?.ctaText ?? 'Browse the menu'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10 sm:h-12 sm:w-12"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="relative min-h-[220px] sm:min-h-[320px]">
          <img
            src={hero?.image?.url ?? DEFAULT_HERO_IMAGE}
            alt={hero?.headline ?? 'A box of fresh motichoor laddu, one of the sweets made on Gara'}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div id="stats">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <div className="flex flex-col justify-center rounded-xl2 border border-paper-50/10 bg-surface-950 p-4 text-white shadow-sm sm:p-6">
            <span className="font-display text-2xl font-bold sm:text-3xl">{categories?.length ?? '—'}</span>
            <span className="mt-1 text-xs text-white/60 sm:text-sm">Menu categories</span>
          </div>
          <div className="flex flex-col justify-center rounded-xl2 border border-paper-50/10 bg-surface-200 p-4 shadow-sm sm:p-6">
            <span className="font-display text-2xl font-bold text-paper-50 sm:text-3xl">{data?.pagination.total ?? '—'}+</span>
            <span className="mt-1 text-xs text-paper-400 sm:text-sm">Menu items</span>
          </div>
          {highlightItems.map(({ icon, label }, i) => (
            <div
              key={`${label}-${i}`}
              className="flex flex-col justify-center gap-2 rounded-xl2 border border-paper-50/10 bg-surface-50 p-4 shadow-sm sm:gap-3 sm:p-6"
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-xs font-medium text-paper-200 sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div id="categories">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/products?category=${c._id}`}
                className="group flex items-center gap-3 rounded-xl2 border border-paper-50/10 bg-surface-50 p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-md sm:gap-4 sm:p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-200 text-2xl">
                  {c.icon}
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold text-paper-50">{c.name}</span>
                  <span className="flex items-center gap-1 text-sm text-paper-400 group-hover:text-brand-500">
                    Shop now
                    <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div id="products">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <Eyebrow>Fresh off the stove</Eyebrow>
              <h2 className="mt-1 font-display text-2xl font-semibold text-paper-50">New arrivals</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-brand-500 hover:text-brand-600">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div id="bento" className="grid gap-5 md:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden rounded-xl2 shadow-sm">
          <img
            src="https://images.pexels.com/photos/37330104/pexels-photo-37330104.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Hands preparing fresh ingredients on a cutting board in a home kitchen"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/85 via-surface-950/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">Made in real kitchens</h3>
            <p className="mt-1 max-w-sm text-sm text-white/70">
              No factories, no assembly lines. Every order comes fresh off the stove.
            </p>
          </div>
        </div>
        <Link
          to="/products"
          className="group flex flex-col justify-between rounded-xl2 border border-brand-400/30 bg-brand-500/10 p-6 shadow-sm transition hover:border-brand-400/60 hover:shadow-md sm:p-8"
        >
          <div>
            <h3 className="font-display text-xl font-semibold text-paper-50 sm:text-2xl">Quality you can taste</h3>
            <p className="mt-2 max-w-xs text-sm text-paper-400">
              Every batch is prepared fresh and checked for quality before it reaches your door.
            </p>
            <ul className="mt-6 space-y-3">
              {QUALITY_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-paper-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 group-hover:text-brand-600">
            Explore the menu
            <ArrowUpRight size={16} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </Link>
      </div>

      <div id="testimonials">
        <h2 className="mb-6 font-display text-2xl font-semibold text-paper-50">What people are saying</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-xl2 border border-paper-50/10 bg-surface-50 p-5 shadow-sm sm:p-6">
              <blockquote className="flex-1 text-sm leading-relaxed text-paper-200">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="block font-semibold text-paper-50">{t.name}</span>
                <span className="text-paper-600">{t.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <section id="cta" className="rounded-xl2 bg-surface-950 px-5 py-10 text-center text-white sm:px-8 sm:py-14">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl md:text-4xl">Come & devour</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60 sm:text-base">
          Hungry for something homemade? Explore today's menu, freshly made.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
        >
          Browse the menu
        </Link>
      </section>
    </div>
  );
}
