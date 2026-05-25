import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext',
    // Use default esbuild minifier, which is faster and doesn't require an extra dependency
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) return 'vendor-mui';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-recharts';
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
