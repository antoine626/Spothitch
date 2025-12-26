/**
 * SEO Utilities
 * Structured Data, Meta Tags, Open Graph
 */

const BASE_URL = 'https://antoine626.github.io/Spothitch';
const APP_NAME = 'SpotHitch';

/**
 * Generate Organization structured data
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/icon-512.png`,
    sameAs: [
      'https://github.com/antoine626/Spothitch'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['French', 'English', 'Spanish']
    }
  };
}

/**
 * Generate WebApplication structured data
 */
export function getWebAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: APP_NAME,
    description: 'Application communautaire pour autostoppeurs. Trouvez et partagez les meilleurs spots d\'auto-stop en Europe.',
    url: BASE_URL,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR'
    },
    featureList: [
      'Interactive hitchhiking spots map',
      'Community ratings and reviews',
      'Route planner',
      'Offline support',
      'Multi-language support'
    ],
    screenshot: `${BASE_URL}/screenshot-mobile.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '156',
      bestRating: '5',
      worstRating: '1'
    }
  };
}

/**
 * Generate Place structured data for a spot
 * @param {Object} spot - Spot data
 */
export function getSpotSchema(spot) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `Spot d'autostop: ${spot.from} → ${spot.to}`,
    description: spot.description,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: spot.coordinates?.lat,
      longitude: spot.coordinates?.lng
    },
    photo: spot.photoUrl,
    aggregateRating: spot.globalRating ? {
      '@type': 'AggregateRating',
      ratingValue: spot.globalRating.toFixed(1),
      ratingCount: spot.totalReviews || 1,
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: spot.country
    }
  };
}

/**
 * Generate BreadcrumbList structured data
 * @param {Array} items - Breadcrumb items [{name, url}]
 */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

/**
 * Generate FAQPage structured data
 */
export function getFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Comment trouver un bon spot d\'autostop ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Utilisez SpotHitch pour trouver des spots vérifiés par la communauté. Les meilleurs spots ont une bonne visibilité, sont sécurisés et ont un trafic régulier vers votre destination.'
        }
      },
      {
        '@type': 'Question',
        name: 'L\'application fonctionne-t-elle hors ligne ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, SpotHitch est une PWA qui fonctionne hors ligne. Les spots que vous avez consultés sont mis en cache pour une utilisation sans connexion.'
        }
      },
      {
        '@type': 'Question',
        name: 'Comment ajouter un nouveau spot ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cliquez sur le bouton "Ajouter un spot", renseignez les informations (lieu, description, photo) et partagez votre expérience avec la communauté.'
        }
      }
    ]
  };
}

/**
 * Inject structured data into page
 * @param {Object} schema - Schema.org object
 * @param {string} id - Script element ID
 */
export function injectSchema(schema, id = 'structured-data') {
  let script = document.getElementById(id);

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schema);
}

/**
 * Update meta tags dynamically
 * @param {Object} meta - Meta data
 */
export function updateMetaTags({ title, description, image, url, type = 'website' }) {
  // Title
  if (title) {
    document.title = `${title} | ${APP_NAME}`;
    updateMeta('og:title', title);
    updateMeta('twitter:title', title);
  }

  // Description
  if (description) {
    updateMeta('description', description);
    updateMeta('og:description', description);
    updateMeta('twitter:description', description);
  }

  // Image
  if (image) {
    updateMeta('og:image', image);
    updateMeta('twitter:image', image);
  }

  // URL
  const pageUrl = url || window.location.href;
  updateMeta('og:url', pageUrl);
  updateLink('canonical', pageUrl);

  // Type
  updateMeta('og:type', type);
}

function updateMeta(name, content) {
  const isOG = name.startsWith('og:') || name.startsWith('twitter:');
  const attr = isOG ? 'property' : 'name';

  let meta = document.querySelector(`meta[${attr}="${name}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function updateLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

/**
 * Generate sitemap entries for spots
 * @param {Array} spots - Array of spots
 * @returns {string} Sitemap XML
 */
export function generateSitemapXML(spots) {
  const urls = [
    { loc: BASE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/?tab=spots`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/?tab=chat`, priority: '0.7', changefreq: 'hourly' },
    ...spots.map(spot => ({
      loc: `${BASE_URL}/?spot=${spot.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: spot.lastUsed || new Date().toISOString().split('T')[0]
    }))
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

/**
 * Initialize SEO for the app
 */
export function initSEO() {
  // Inject base schemas
  injectSchema([
    getOrganizationSchema(),
    getWebAppSchema()
  ], 'app-schema');

  // Set default meta tags
  updateMetaTags({
    title: 'Trouvez les meilleurs spots d\'autostop',
    description: 'Application communautaire pour autostoppeurs. Trouvez, partagez et évaluez les meilleurs spots d\'auto-stop en Europe.',
    image: `${BASE_URL}/og-image.png`
  });
}

/**
 * Track page view for analytics
 * @param {string} page - Page name
 */
export function trackPageView(page) {
  // Update canonical URL
  const url = `${BASE_URL}/?tab=${page}`;
  updateLink('canonical', url);
  updateMeta('og:url', url);

  // Analytics event (if available)
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: page,
      page_location: url
    });
  }
}

export default {
  getOrganizationSchema,
  getWebAppSchema,
  getSpotSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  injectSchema,
  updateMetaTags,
  generateSitemapXML,
  initSEO,
  trackPageView
};
