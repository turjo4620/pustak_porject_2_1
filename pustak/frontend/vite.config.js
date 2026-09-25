import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'https://putak-porject-2-1.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
