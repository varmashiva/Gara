import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Gara';
const SITE_URL = 'https://garafoods.com';
const DEFAULT_IMAGE =
  'https://images.pexels.com/photos/19151506/pexels-photo-19151506.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';

type SeoProps = {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
};

// Per-route <title>/description/canonical/OG — layered on top of the
// static defaults in index.html (those exist because non-JS crawlers and
// link-preview bots never see anything Helmet injects after the page
// loads; this is what actual users and JS-executing crawlers get).
export function Seo({ title, description, image, noindex, jsonLd }: SeoProps) {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
