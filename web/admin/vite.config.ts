import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/admin': {
        target: process.env.VITE_API_URL || 'http://admin:8083',
        changeOrigin: true,
      },
      '/mining': {
        target: process.env.VITE_MINER_URL || 'http://miner:8082',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://admin:8083',
        ws: true,
      },
    },
  },
})
