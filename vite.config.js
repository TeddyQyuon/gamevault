import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GameVault frontend (Vite + React). /api is proxied to Express in dev so
// cookies + CORS behave like production (same-site, credentials included).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
  },
})
