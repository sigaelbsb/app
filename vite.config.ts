import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Soporte para Electron (file://), Capacitor (nativo) y Web
  server: {
    port: 5173,
    watch: {
      ignored: [
        '**/release/**',
        '**/dist-electron/**',
        '**/android/**',
        '**/public/downloads/**',
        '**/.git/**'
      ]
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
