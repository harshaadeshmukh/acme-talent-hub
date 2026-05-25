import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui'
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})
