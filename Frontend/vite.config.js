import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  server: {
    host:'0.0.0.0',
    allowedHosts: true, 
    
    proxy: {
      '/api': 'http://43.204.31.227:8080',
      '/otp': 'http://43.204.31.227:8080',
      '/websocket': {
        target: 'http://43.204.31.227:8080',
        ws: true,
      },
    },
  },
})
