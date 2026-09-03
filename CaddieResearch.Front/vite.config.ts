import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://caddieresearch-api-gnewb5eebrckadfk.brazilsouth-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
