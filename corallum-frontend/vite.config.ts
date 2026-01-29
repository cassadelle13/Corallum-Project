import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Corallum-Project/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3002,
    allowedHosts: [
      'localhost',
      '127.0.0.1'
    ],
    cors: { 
      origin: ['http://localhost:3002', 'http://localhost:3000', 'http://127.0.0.1:3002'],
      credentials: true 
    },
    proxy: {
      // Прокси для API запросов к corallum-enterprise
      '^/api/.*': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8003',
        changeOrigin: true,
        secure: false
      },
      // Прокси для Jarilo Brain (SSE/HTTP)
      '^/jarilo/.*': {
        target: process.env.VITE_JARILO_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/jarilo/, '')
      },
      // Прокси для WebSocket к corallum-enterprise
      '^/ws/.*': {
        target: process.env.VITE_WS_BASE_URL || 'ws://localhost:8003',
        changeOrigin: true,
        ws: true
      }
    }
  },
  define: {
    // Глобальные переменные для API
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})
