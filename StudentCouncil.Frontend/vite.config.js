import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/] 
      },
      manifest: {
        name: 'Студсовет СГН',
        short_name: 'Студсовет',
        description: 'Платформа для управления студенческим советом',
        theme_color: '#ffffff',      
        background_color: '#f8fafc', 
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5247',
        changeOrigin: true,
        secure: false
      },
      '/avatars': {
        target: 'http://localhost:5247',
        changeOrigin: true,
        secure: false
      },
      '/event-images': {
        target: 'http://localhost:5247',
        changeOrigin: true,
        secure: false
      },
      '/music': {
        target: 'http://localhost:5247',
        changeOrigin: true,
        secure: false
      }
    }
  }
})