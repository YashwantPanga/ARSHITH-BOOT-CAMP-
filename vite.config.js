import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // on-demand chunks are named by content hash only, so file names do not describe what they hold
  build: { rollupOptions: { output: { chunkFileNames: 'assets/c-[hash].js' } } },
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
    testTimeout: 120000,
    hookTimeout: 60000
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
