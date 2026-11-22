import { createHash } from 'node:crypto'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Base path for the build. Set BASE_PATH=/light-diya/ to serve the site from a
 * sub-path (for example GitHub Pages). Defaults to the domain root.
 */
function basePath(): string {
  const raw = process.env.BASE_PATH?.trim() || '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

/**
 * Hex SHA-256 of ADMIN_KEY. Only the hash is embedded in the client bundle.
 * Local/CI builds default to "e2e-admin" so Playwright can unlock `/admin`.
 * Production Pages builds must set the ADMIN_KEY secret.
 */
function adminKeyHash(): string {
  const key = process.env.ADMIN_KEY?.trim() || 'e2e-admin'
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

/**
 * Production builds carry a Content-Security-Policy meta tag that limits every
 * kind of request to the site's own origin. The dev server is left alone
 * because hot reload needs inline scripts and a websocket.
 */
function csp(): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function cspMeta(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: csp() },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig({
  base: basePath(),
  plugins: [react(), cspMeta()],
  define: {
    // Vercel Web Analytics is served by Vercel itself (/_vercel/insights), so
    // it is only switched on for builds made there (Vercel sets VERCEL=1).
    __VERCEL_ANALYTICS__: JSON.stringify(process.env.VERCEL === '1'),
    __ADMIN_KEY_HASH__: JSON.stringify(adminKeyHash()),
  },
  build: {
    // Keep every asset as a real file so the CSP never needs to allow data: URIs.
    assetsInlineLimit: 0,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
