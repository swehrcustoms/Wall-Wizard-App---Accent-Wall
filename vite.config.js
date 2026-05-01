import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const SUPABASE_URL_PATTERN = /https:\/\/[a-z0-9]+\.supabase\.co\//;

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'WallWizard',
        short_name: 'WallWizard',
        description: 'Accent wall design, cut lists, and client quotes for contractors',
        theme_color: '#0284c7',
        background_color: '#0284c7',
        display: 'standalone',
        orientation: 'landscape-primary',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Precache the entire app shell (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Skip waiting so updates apply immediately on reload
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // Supabase auth + API — stale-while-revalidate
          {
            urlPattern: SUPABASE_URL_PATTERN,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Pattern thumbnails — cache-first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Google Fonts / CDN assets — stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },

      devOptions: {
        // Disable SW in dev so HMR works normally
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('canvg')) return;
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('dompurify')) return;
        warn(warning);
      },
    },
  },

  test: {
    environment: 'node',
    globals: true,
  },
});
