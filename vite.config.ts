import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mortgage Calculator',
        short_name: 'Mortgage',
        description:
          'A free, mobile-first mortgage calculator with live national average rates.',
        display: 'standalone',
        // Matches --color-accent / --color-bg in src/styles/tokens.css
        theme_color: '#0f766e',
        background_color: '#f4f6f8',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // /api/* must hit the network (Netlify function), never the SPA fallback
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
