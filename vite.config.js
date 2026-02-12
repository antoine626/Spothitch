import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { writeFileSync } from 'fs';

// Generate version.json on each build so the app can auto-reload
function versionPlugin() {
  return {
    name: 'version-json',
    writeBundle({ dir }) {
      const version = Date.now().toString(36)
      writeFileSync(`${dir}/version.json`, JSON.stringify({ version, built: new Date().toISOString() }))
    }
  }
}

export default defineConfig({
  base: '/',

  plugins: [
    // Tailwind CSS v4
    tailwindcss(),

    // Version check for auto-reload
    versionPlugin(),

    // PWA Plugin
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-*.png', 'og-image.png'],
      manifest: {
        name: 'SpotHitch - La communauté des autostoppeurs',
        short_name: 'SpotHitch',
        description: 'Trouvez les meilleurs spots d\'auto-stop dans le monde. 37 000+ spots dans 170 pays.',
        theme_color: '#f59e0b',
        background_color: '#0f1520',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
          {
            name: 'Ajouter un spot',
            short_name: 'Ajouter',
            url: '/?action=add-spot',
            icons: [{ src: 'icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Carte',
            short_name: 'Carte',
            url: '/?tab=spots',
            icons: [{ src: 'icon-96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/design-/, /^\/debug-/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.(org|fr|de)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'osrm-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 }
            }
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nominatim-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    }),
    
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    
    // Sentry Source Maps (enable in production)
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**'
      }
    })
  ].filter(Boolean),
  
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['mixpanel-browser'],
      output: {
        manualChunks: {
          'vendor-leaflet': ['leaflet', 'leaflet.markercluster'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-utils': ['dompurify'],
          'gamification': [
            './src/services/gamification.js',
            './src/services/quiz.js',
            './src/services/teamChallenges.js',
            './src/services/friendChallenges.js',
            './src/services/dailyReward.js',
            './src/services/weeklyLeaderboard.js',
          ],
          'social': [
            './src/services/realtimeChat.js',
            './src/services/travelGroups.js',
            './src/services/nearbyFriends.js',
            './src/services/profileCustomization.js',
          ],
          'admin': [
            './src/services/adminModeration.js',
            './src/services/moderation.js',
          ],
          'guides': [
            './src/data/guides.js',
          ],
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  preview: {
    port: 4173
  },
  
  css: {},
  
  optimizeDeps: {
    include: ['leaflet', 'firebase/app', 'dompurify']
  }
});
