import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Minimal ambient typing so `tsc -b` accepts the single process.env read below
// without pulling in @types/node as a new dependency.
declare const process: { env: { VERCEL?: string } }

// Two hosting targets share this one build:
//   - GitHub Pages serves the project site beneath /<repo>/, so it needs
//     base '/mngstamper/'.
//   - Vercel serves the same dist/ at the domain ROOT, so it needs base '/'.
// Vercel always sets process.env.VERCEL (=1) during its build, GitHub Pages
// does not, so we key the production base off that. Dev serves from "/".
// If the repo is ever renamed, adjust GH_PAGES_BASE accordingly.
const GH_PAGES_BASE = '/mngstamper/'
const PROD_BASE = process.env.VERCEL ? '/' : GH_PAGES_BASE

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? PROD_BASE : '/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'logo.jpg'],
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
