import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// В dev-режиме API и WebSocket проксируются на Django, чтобы фронт и бэк жили на одном origin
const backend = process.env.BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/admin': backend,
      '/static': backend,
      '/ws': { target: backend.replace(/^http/, 'ws'), ws: true },
    },
  },
})
