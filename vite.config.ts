import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo.jpg'],
      manifest: {
        name: 'Universal Rubber Stamp',
        short_name: 'URS',
        description: 'Stamp Documents. Anywhere. Securely.',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'logo.jpg', sizes: '192x192', type: 'image/jpeg' },
          { src: 'logo.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },
      workbox: {
        // Pre-cache the app shell; document libraries are lazy-loaded at runtime.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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
})
