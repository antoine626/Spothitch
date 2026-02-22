/**
 * SEO Utilities
 * Structured Data, Meta Tags, Open Graph, Hreflang, Preload
 *
 * Features:
 * - Dynamic meta tags management
 * - Multi-language hreflang support
 * - Social media meta tags (OG, Twitter, Pinterest, LinkedIn)
 * - Geo meta tags for location-based content
 * - PWA-specific meta tags
 * - Preload/prefetch resource management
 * - Advanced robots meta directives
 * - Core Web Vitals optimization hints
 */

const BASE_URL = 'https://spothitch.com';
const APP_NAME = 'SpotHitch';
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de'];
const DEFAULT_LANGUAGE = 'fr';

// Language to locale mapping for hreflang
const LANGUAGE_LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  de: 'de-DE'
};

// SEO configuration by page type
const PAGE_META_CONFIG = {
  home: {
    title: {
      fr: 'SpotHitch - La communaute des autostoppeurs',
      en: 'SpotHitch - The Hitchhiking Community',
      es: 'SpotHitch - La comunidad de autoestopistas',
      de: 'SpotHitch - Die Tramper-Community'
    },
    description: {
      fr: 'Trouvez les meilleurs spots d\'auto-stop dans le monde. Plus de 100 spots verifies, guides par pays, planificateur de voyage et communaute active.',
      en: 'Find the best hitchhiking spots around the world. Over 100 verified spots, country guides, trip planner and active community.',
      es: 'Encuentra los mejores spots de autoestop en Europa. Mas de 100 spots verificados, guias por pais, planificador de viajes y comunidad activa.',
      de: 'Finden Sie die besten Tramper-Spots in Europa. Uber 100 verifizierte Spots, Landerfuhrer, Reiseplaner und aktive Community.'
    },
    keywords: {
      fr: 'autostop, hitchhiking, spots, voyage, backpacking, worldwide, monde, auto-stop, pouce, routard, aventure',
      en: 'hitchhiking, hitching, spots, travel, backpacking, worldwide, thumb, traveler, adventure',
      es: 'autoestop, dedo, spots, viaje, mochilero, mundial, aventura, viajero',
      de: 'trampen, anhalter, spots, reise, backpacking, weltweit, abenteuer, reisender'
    }
  },
  spots: {
    title: {
      fr: 'Spots d\'autostop | SpotHitch',
      en: 'Hitchhiking Spots | SpotHitch',
      es: 'Spots de autoestop | SpotHitch',
      de: 'Tramper-Spots | SpotHitch'
    },
    description: {
      fr: 'Decouvrez tous les spots d\'autostop verifies par la communaute. Filtrez par pays, note et distance.',
      en: 'Discover all hitchhiking spots verified by the community. Filter by country, rating and distance.',
      es: 'Descubre todos los spots de autoestop verificados por la comunidad. Filtra por pais, valoracion y distancia.',
      de: 'Entdecken Sie alle von der Community verifizierten Tramper-Spots. Filtern Sie nach Land, Bewertung und Entfernung.'
    }
  },
  map: {
    title: {
      fr: 'Carte interactive | SpotHitch',
      en: 'Interactive Map | SpotHitch',
      es: 'Mapa interactivo | SpotHitch',
      de: 'Interaktive Karte | SpotHitch'
    },
    description: {
      fr: 'Visualisez tous les spots d\'autostop sur une carte interactive. Planifiez votre itineraire facilement.',
      en: 'View all hitchhiking spots on an interactive map. Plan your route easily.',
      es: 'Visualiza todos los spots de autoestop en un mapa interactivo. Planifica tu ruta facilmente.',
      de: 'Sehen Sie alle Tramper-Spots auf einer interaktiven Karte. Planen Sie Ihre Route einfach.'
    }
  },
  profile: {
    title: {
      fr: 'Mon profil | SpotHitch',
      en: 'My Profile | SpotHitch',
      es: 'Mi perfil | SpotHitch',
      de: 'Mein Profil | SpotHitch'
    },
    description: {
      fr: 'Gerez votre profil, vos badges et vos statistiques de voyage.',
      en: 'Manage your profile, badges and travel statistics.',
      es: 'Gestiona tu perfil, insignias y estadisticas de viaje.',
      de: 'Verwalten Sie Ihr Profil, Abzeichen und Reisestatistiken.'
    }
  },
  chat: {
    title: {
      fr: 'Communaute | SpotHitch',
      en: 'Community | SpotHitch',
      es: 'Comunidad | SpotHitch',
      de: 'Community | SpotHitch'
    },
    description: {
      fr: 'Echangez avec la communaute des autostoppeurs. Partagez vos experiences et trouvez des compagnons de voyage.',
      en: 'Chat with the hitchhiking community. Share your experiences and find travel companions.',
      es: 'Chatea con la comunidad de autoestopistas. Comparte tus experiencias y encuentra companeros de viaje.',
      de: 'Chatten Sie mit der Tramper-Community. Teilen Sie Ihre Erfahrungen und finden Sie Reisepartner.'
    }
  }
};

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
    description: 'Application communautaire pour autostoppeurs. Trouvez et partagez les meilleurs spots d\'auto-stop dans le monde.',
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
export function updateMetaTags({ title, description, image, url, type = 'website', keywords, author, robots }) {
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

  // Keywords (optional)
  if (keywords) {
    updateMeta('keywords', keywords);
  }

  // Author (optional)
  if (author) {
    updateMeta('author', author);
  }

  // Robots (optional)
  if (robots) {
    updateMeta('robots', robots);
  }
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
 * Set hreflang tags for multi-language SEO
 * @param {string} currentLang - Current language code
 * @param {string} currentPath - Current page path (without lang)
 */
export function setHreflangTags(_currentLang = DEFAULT_LANGUAGE, currentPath = '') {
  // Remove existing hreflang links
  const existingLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingLinks.forEach(link => link.remove());

  // Add hreflang for each supported language
  SUPPORTED_LANGUAGES.forEach(lang => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = LANGUAGE_LOCALES[lang] || lang;
    link.href = `${BASE_URL}${currentPath}${currentPath.includes('?') ? '&' : '?'}lang=${lang}`;
    document.head.appendChild(link);
  });

  // Add x-default hreflang
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${BASE_URL}${currentPath}`;
  document.head.appendChild(defaultLink);
}

/**
 * Get all hreflang links currently set
 * @returns {Array} Array of hreflang objects
 */
export function getHreflangTags() {
  const links = document.querySelectorAll('link[rel="alternate"][hreflang]');
  return Array.from(links).map(link => ({
    hreflang: link.hreflang,
    href: link.href
  }));
}

/**
 * Set geo meta tags for location-based content
 * @param {Object} geo - Geo data { lat, lng, region, placename, country }
 */
export function setGeoMetaTags(geo) {
  if (!geo) return;

  if (geo.lat !== undefined && geo.lng !== undefined) {
    updateMeta('geo.position', `${geo.lat};${geo.lng}`);
    updateMeta('ICBM', `${geo.lat}, ${geo.lng}`);
  }

  if (geo.region) {
    updateMeta('geo.region', geo.region);
  }

  if (geo.placename) {
    updateMeta('geo.placename', geo.placename);
  }

  if (geo.country) {
    updateMeta('geo.country', geo.country);
  }
}

/**
 * Get current geo meta tags
 * @returns {Object} Geo meta data
 */
export function getGeoMetaTags() {
  const position = document.querySelector('meta[name="geo.position"]');
  const region = document.querySelector('meta[name="geo.region"]');
  const placename = document.querySelector('meta[name="geo.placename"]');
  const country = document.querySelector('meta[name="geo.country"]');
  const icbm = document.querySelector('meta[name="ICBM"]');

  const result = {};

  if (position) {
    const [lat, lng] = position.content.split(';');
    result.lat = parseFloat(lat);
    result.lng = parseFloat(lng);
  }

  if (region) result.region = region.content;
  if (placename) result.placename = placename.content;
  if (country) result.country = country.content;
  if (icbm) result.icbm = icbm.content;

  return result;
}

/**
 * Set advanced robots meta directives
 * @param {Object} directives - Robot directives
 */
export function setRobotsDirectives(directives = {}) {
  const {
    index = true,
    follow = true,
    noarchive = false,
    nosnippet = false,
    notranslate = false,
    noimageindex = false,
    maxSnippet = null,
    maxImagePreview = null,
    maxVideoPreview = null
  } = directives;

  const parts = [];

  parts.push(index ? 'index' : 'noindex');
  parts.push(follow ? 'follow' : 'nofollow');

  if (noarchive) parts.push('noarchive');
  if (nosnippet) parts.push('nosnippet');
  if (notranslate) parts.push('notranslate');
  if (noimageindex) parts.push('noimageindex');

  if (maxSnippet !== null) parts.push(`max-snippet:${maxSnippet}`);
  if (maxImagePreview !== null) parts.push(`max-image-preview:${maxImagePreview}`);
  if (maxVideoPreview !== null) parts.push(`max-video-preview:${maxVideoPreview}`);

  updateMeta('robots', parts.join(', '));

  return parts.join(', ');
}

/**
 * Get current robots directives
 * @returns {string} Current robots content
 */
export function getRobotsDirectives() {
  const meta = document.querySelector('meta[name="robots"]');
  return meta ? meta.content : '';
}

/**
 * Add preload link for critical resources
 * @param {string} href - Resource URL
 * @param {string} as - Resource type (script, style, image, font, fetch)
 * @param {Object} options - Additional options
 */
export function addPreload(href, as, options = {}) {
  const { crossorigin, type, media } = options;

  // Check if preload already exists
  const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (crossorigin) link.crossOrigin = crossorigin;
  if (type) link.type = type;
  if (media) link.media = media;

  document.head.appendChild(link);
  return link;
}

/**
 * Add prefetch link for future navigation
 * @param {string} href - Resource URL
 * @param {string} as - Resource type (optional)
 */
export function addPrefetch(href, as = null) {
  // Check if prefetch already exists
  const existing = document.querySelector(`link[rel="prefetch"][href="${href}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  if (as) link.as = as;

  document.head.appendChild(link);
  return link;
}

/**
 * Add dns-prefetch for external domains
 * @param {string} origin - Domain origin (e.g., https://api.example.com)
 */
export function addDnsPrefetch(origin) {
  // Check if dns-prefetch already exists
  const existing = document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = origin;

  document.head.appendChild(link);
  return link;
}

/**
 * Add preconnect for external domains
 * @param {string} origin - Domain origin
 * @param {boolean} crossorigin - Enable CORS
 */
export function addPreconnect(origin, crossorigin = false) {
  // Check if preconnect already exists
  const existing = document.querySelector(`link[rel="preconnect"][href="${origin}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;

  if (crossorigin) link.crossOrigin = 'anonymous';

  document.head.appendChild(link);
  return link;
}

/**
 * Get all preload/prefetch/preconnect links
 * @returns {Object} Object with arrays of resource hints
 */
export function getResourceHints() {
  return {
    preload: Array.from(document.querySelectorAll('link[rel="preload"]')).map(l => ({
      href: l.href,
      as: l.as
    })),
    prefetch: Array.from(document.querySelectorAll('link[rel="prefetch"]')).map(l => ({
      href: l.href,
      as: l.as
    })),
    preconnect: Array.from(document.querySelectorAll('link[rel="preconnect"]')).map(l => ({
      href: l.href
    })),
    dnsPrefetch: Array.from(document.querySelectorAll('link[rel="dns-prefetch"]')).map(l => ({
      href: l.href
    }))
  };
}

/**
 * Set Pinterest-specific meta tags
 * @param {Object} options - Pinterest options
 */
export function setPinterestMeta(options = {}) {
  const { nopin = false, description, richPin = true } = options;

  if (nopin) {
    updateMeta('pinterest', 'nopin');
  } else {
    // Remove nopin if exists
    const meta = document.querySelector('meta[name="pinterest"][content="nopin"]');
    if (meta) meta.remove();
  }

  if (description) {
    updateMeta('pinterest:description', description);
  }

  if (richPin) {
    updateMeta('pinterest-rich-pin', 'true');
  }
}

/**
 * Set LinkedIn article meta tags
 * @param {Object} article - Article data
 */
export function setLinkedInMeta(article = {}) {
  const { author, publishedTime, modifiedTime, section, tag } = article;

  if (author) {
    updateMeta('article:author', author);
  }

  if (publishedTime) {
    updateMeta('article:published_time', publishedTime);
  }

  if (modifiedTime) {
    updateMeta('article:modified_time', modifiedTime);
  }

  if (section) {
    updateMeta('article:section', section);
  }

  if (tag) {
    const tags = Array.isArray(tag) ? tag : [tag];
    tags.forEach((t) => {
      updateMeta('article:tag', t);
    });
  }
}

/**
 * Set PWA-specific meta tags
 * @param {Object} options - PWA options
 */
export function setPWAMetaTags(options = {}) {
  const {
    themeColor = '#f59e0b',
    appName = APP_NAME,
    startUrl = '/',
    display = 'standalone',
    orientation = 'portrait',
    statusBarStyle = 'black-translucent'
  } = options;

  // Theme color for light mode
  updateMeta('theme-color', themeColor);

  // Apple-specific PWA meta tags
  updateMeta('apple-mobile-web-app-capable', 'yes');
  updateMeta('apple-mobile-web-app-status-bar-style', statusBarStyle);
  updateMeta('apple-mobile-web-app-title', appName);

  // Microsoft-specific PWA meta tags
  updateMeta('msapplication-TileColor', themeColor);
  updateMeta('msapplication-starturl', startUrl);
  updateMeta('msapplication-navbutton-color', themeColor);

  // Mobile web app capable
  updateMeta('mobile-web-app-capable', 'yes');
  updateMeta('application-name', appName);

  // Format detection (prevent auto-linking phone numbers, etc.)
  updateMeta('format-detection', 'telephone=no');

  return {
    themeColor,
    appName,
    startUrl,
    display,
    orientation
  };
}

/**
 * Get current PWA meta tags
 * @returns {Object} PWA meta data
 */
export function getPWAMetaTags() {
  return {
    themeColor: document.querySelector('meta[name="theme-color"]')?.content,
    appName: document.querySelector('meta[name="application-name"]')?.content,
    appleAppCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
    appleStatusBar: document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content,
    mobileAppCapable: document.querySelector('meta[name="mobile-web-app-capable"]')?.content
  };
}

/**
 * Update page meta for a specific page type
 * @param {string} pageType - Page type (home, spots, map, profile, chat)
 * @param {string} lang - Language code
 */
export function updatePageMeta(pageType, lang = DEFAULT_LANGUAGE) {
  const config = PAGE_META_CONFIG[pageType];
  if (!config) {
    console.warn(`[SEO] Unknown page type: ${pageType}`);
    return false;
  }

  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

  updateMetaTags({
    title: config.title[safeLang] || config.title[DEFAULT_LANGUAGE],
    description: config.description[safeLang] || config.description[DEFAULT_LANGUAGE],
    keywords: config.keywords?.[safeLang] || config.keywords?.[DEFAULT_LANGUAGE],
    url: `${BASE_URL}/?tab=${pageType}&lang=${safeLang}`
  });

  // Set hreflang for current page
  setHreflangTags(safeLang, `/?tab=${pageType}`);

  return true;
}

/**
 * Get page meta configuration
 * @param {string} pageType - Page type
 * @param {string} lang - Language code
 * @returns {Object} Meta configuration for the page
 */
export function getPageMetaConfig(pageType, lang = DEFAULT_LANGUAGE) {
  const config = PAGE_META_CONFIG[pageType];
  if (!config) return null;

  const safeLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

  return {
    title: config.title[safeLang] || config.title[DEFAULT_LANGUAGE],
    description: config.description[safeLang] || config.description[DEFAULT_LANGUAGE],
    keywords: config.keywords?.[safeLang] || config.keywords?.[DEFAULT_LANGUAGE]
  };
}

/**
 * Get all supported languages
 * @returns {Array} Array of supported language codes
 */
export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

/**
 * Get language locale
 * @param {string} lang - Language code
 * @returns {string} Locale code
 */
export function getLanguageLocale(lang) {
  return LANGUAGE_LOCALES[lang] || lang;
}

/**
 * Set viewport meta for responsive design
 * @param {Object} options - Viewport options
 */
export function setViewportMeta(options = {}) {
  const {
    width = 'device-width',
    initialScale = 1.0,
    maximumScale = 1.0,
    userScalable = 'no',
    viewportFit = 'cover'
  } = options;

  const content = [
    `width=${width}`,
    `initial-scale=${initialScale}`,
    `maximum-scale=${maximumScale}`,
    `user-scalable=${userScalable}`,
    `viewport-fit=${viewportFit}`
  ].join(', ');

  updateMeta('viewport', content);

  return content;
}

/**
 * Get current viewport settings
 * @returns {Object} Viewport settings
 */
export function getViewportMeta() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return null;

  const content = meta.content;
  const parts = content.split(',').map(p => p.trim());
  const result = {};

  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });

  return result;
}

/**
 * Set referrer policy
 * @param {string} policy - Referrer policy value
 */
export function setReferrerPolicy(policy = 'strict-origin-when-cross-origin') {
  updateMeta('referrer', policy);
  return policy;
}

/**
 * Remove all dynamically added SEO elements
 * Useful for cleanup in tests
 */
export function cleanupSEO() {
  // Remove dynamically added schemas
  const schemas = document.querySelectorAll('script[type="application/ld+json"]');
  schemas.forEach(s => s.remove());

  // Remove hreflang links
  const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
  hreflangLinks.forEach(l => l.remove());

  // Remove preload/prefetch links
  const resourceHints = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
  resourceHints.forEach(l => l.remove());
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
    description: 'Application communautaire pour autostoppeurs. Trouvez, partagez et evaluez les meilleurs spots d\'auto-stop dans le monde.',
    image: `${BASE_URL}/og-image.png`
  });

  // Set default robots
  setRobotsDirectives({
    index: true,
    follow: true,
    maxSnippet: 160,
    maxImagePreview: 'large'
  });

  // Set hreflang for home page
  setHreflangTags(DEFAULT_LANGUAGE, '');

  // Set PWA meta tags
  setPWAMetaTags();

  // Add preconnects for external resources
  addPreconnect('https://fonts.googleapis.com');
  addPreconnect('https://fonts.gstatic.com', true);
  addDnsPrefetch('https://nominatim.openstreetmap.org');
  addDnsPrefetch('https://router.project-osrm.org');

  // Set referrer policy
  setReferrerPolicy('strict-origin-when-cross-origin');
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
  // Schemas
  getOrganizationSchema,
  getWebAppSchema,
  getSpotSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  injectSchema,
  // Meta tags
  updateMetaTags,
  setHreflangTags,
  getHreflangTags,
  setGeoMetaTags,
  getGeoMetaTags,
  setRobotsDirectives,
  getRobotsDirectives,
  setPinterestMeta,
  setLinkedInMeta,
  setPWAMetaTags,
  getPWAMetaTags,
  setViewportMeta,
  getViewportMeta,
  setReferrerPolicy,
  // Page meta
  updatePageMeta,
  getPageMetaConfig,
  getSupportedLanguages,
  getLanguageLocale,
  // Resource hints
  addPreload,
  addPrefetch,
  addDnsPrefetch,
  addPreconnect,
  getResourceHints,
  // Sitemap
  generateSitemapXML,
  // Core functions
  initSEO,
  trackPageView,
  cleanupSEO,
  // Constants
  BASE_URL,
  APP_NAME,
  SUPPORTED_LANGUAGES,
  PAGE_META_CONFIG
};
