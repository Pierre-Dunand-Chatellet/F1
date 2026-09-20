import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/f1/' : le site est servi depuis un sous-dossier sur l'hebergement FTP,
// comme /echecs/ et /coulee/.
export default defineConfig({
  base: '/f1/',
  plugins: [react(), tailwindcss()],
})
