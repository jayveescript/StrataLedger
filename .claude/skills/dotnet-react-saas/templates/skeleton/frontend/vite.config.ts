/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': { target: process.env.VITE_API_PROXY ?? 'http://localhost:5080', changeOrigin: false },
}

// The API is proxied under the same origin so the refresh-token cookie stays SameSite=Strict and first-party.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173, proxy: apiProxy },
  // `vite preview` serves the production build for E2E tests with the same same-origin API proxy.
  preview: { port: 4173, proxy: apiProxy },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
