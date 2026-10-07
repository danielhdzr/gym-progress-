import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Rutas relativas: funciona igual en GitHub Pages (/gym-progress/), en la raíz o dentro de Capacitor.
  base: './',
  server: { host: true },
})
