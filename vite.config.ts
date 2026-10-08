import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves a project site under /<repo>/, so production builds use
// that base. Dev always serves from "/" for convenience. If the repo is ever
// renamed or served from a custom domain, adjust PROD_BASE accordingly.
const PROD_BASE = '/mngstamper/'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? PROD_BASE : '/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo.jpg'],
        manifest: {
          id: base,
          name: 'Universal Rubber Stamp',
          short_name: 'URS',
          description: 'Stamp Documents. Anywhere. Securely.',
          theme_color: '#1e40af',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'any',
          scope: base,
          start_url: base,
          icons: [
            { src: 'logo.jpg', sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
            { src: 'logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any' },
            { src: 'logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Pre-cache the app shell; document libraries are lazy-loaded at runtime.
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico,woff2}'],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1500,
    },
    server: {
      watch: {
        // Browsers drop in-progress downloads into the folder as locked
        // "Unconfirmed *.crdownload" / *.part files. Watching those makes
        // Vite's file watcher crash with EBUSY, so skip them explicitly.
        ignored: ['**/*.crdownload', '**/Unconfirmed*', '**/*.part', '**/*.tmp'],
      },
    },
  }
})
