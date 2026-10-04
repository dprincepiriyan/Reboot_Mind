import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `vite build --mode native` produces the bundle wrapped by Capacitor (Android).
// The PWA service worker is disabled there: the native shell already serves
// assets locally, and a service worker would cache stale bundles in the WebView.
export default defineConfig(({ mode }) => {
  const isNative = mode === 'native'

  return {
    plugins: [
      react(),
      ...(isNative
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
              manifest: {
                name: 'RebootMind — Anonymous Support',
                short_name: 'RebootMind',
                description: 'Anonymous Addiction Recovery & Peer Support Application',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                  {
                    src: '/pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png'
                  },
                  {
                    src: '/pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png'
                  }
                ]
              }
            })
          ])
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        },
        '/socket.io': {
          target: 'http://localhost:8000',
          ws: true
        }
      }
    }
  }
})
