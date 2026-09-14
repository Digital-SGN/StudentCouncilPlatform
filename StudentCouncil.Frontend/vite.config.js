import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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