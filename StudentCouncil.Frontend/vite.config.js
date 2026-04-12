import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:7107',
                changeOrigin: true,
                secure: false,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('proxy error', err);
                    });
                }
            },
            '/avatars': {
                target: 'https://localhost:7107',
                changeOrigin: true,
                secure: false
            },
            '/music': {
                target: 'https://localhost:7107',
                changeOrigin: true,
                secure: false
            }
        }
    }
})