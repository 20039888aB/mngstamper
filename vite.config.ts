import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Minimal ambient typing so `tsc -b` accepts the single process.env read below
// without pulling in @types/node as a new dependency.
declare const process: { env: Record<string, string | undefined> }

// Two hosting targets share this one build:
//   - GitHub Pages serves the project site beneath /<repo>/, so it needs
//     base '/mngstamper/'.
//   - Vercel serves the same dist/ at the domain ROOT, so it needs base '/'.
// Vercel always sets process.env.VERCEL (=1) during its build, GitHub Pages
// does not, so we key the production base off that. Dev serves from "/".
// If the repo is ever renamed, adjust GH_PAGES_BASE accordingly.
const GH_PAGES_BASE = '/mngstamper/'
const PROD_BASE = process.env.VERCEL ? '/' : GH_PAGES_BASE

// Canonical ORIGIN used for crawler files (sitemap/robots). The deployment
// path prefix comes from `base`, so this must be the bare origin only. Each
// host can override VITE_SITE_URL at build time (see .env.example).
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://20039888aB.github.io').replace(/\/$/, '')
const ROUTES = ['/', '/stamp', '/design', '/history', '/settings']
const PRIORITY: Record<string, string> = {
  '/': '1.0',
  '/stamp': '0.9',
  '/design': '0.8',
  '/history': '0.5',
  '/settings': '0.4',
}

// Emits host-correct crawler files into the build output after the bundle is
// written, so one source tree serves both Vercel (root) and GitHub Pages
// (/mngstamper/) with accurate absolute <loc> URLs instead of a hard-coded host.
// Uses Rollup's emitFile (no Node fs/path imports) to stay dependency-free.
function seoFilesPlugin(base: string) {
  return {
    name: 'seo-files',
    apply: 'build' as const,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildStart(this: any) {
      const baseRoot = `${SITE_URL}${base === '/' ? '' : base.replace(/\/$/, '')}`
      const today = new Date().toISOString().slice(0, 10)
      const urls = ROUTES.map((route) => {
        const loc = `${baseRoot}${route === '/' ? '/' : route}`
        return (
          `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n    <priority>${PRIORITY[route]}</priority>\n  </url>`
        )
      }).join('\n')
      const sitemap =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      const robots =
        `# Universal Rubber Stamp - crawler directives\nUser-agent: *\nAllow: /\n\n` +
        `# Single-page app: static assets carry no indexable content.\nDisallow: /assets/\n\n` +
        `Sitemap: ${baseRoot}/sitemap.xml\n`
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? PROD_BASE : '/'
  return {
    base,
    plugins: [
      react(),
      seoFilesPlugin(base),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'logo.jpg'],
        manifest: {
          id: base,
          name: 'Universal Rubber Stamp',
          short_name: 'URS',
          description: 'Stamp Documents. Anywhere. Securely.',
          // SEO / discoverability metadata surfaced by app stores and crawlers.
          lang: 'en',
          categories: ['productivity', 'utilities', 'business'],
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
