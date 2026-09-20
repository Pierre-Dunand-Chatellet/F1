import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/f1/' : le site est servi depuis un sous-dossier sur l'hebergement FTP,
// comme /echecs/ et /coulee/.
//
// Construction multi-pages : chaque partie est un vrai document HTML, servi tel
// quel. Un routeur cote client aurait exige une reecriture serveur pour que les
// liens profonds ne renvoient pas une 404 — impossible sur cet hebergement.
export default defineConfig({
  base: '/f1/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        accueil: resolve(import.meta.dirname, 'index.html'),
        ecuries: resolve(import.meta.dirname, 'ecuries/index.html'),
        calendrier: resolve(import.meta.dirname, 'calendrier/index.html'),
        histoire: resolve(import.meta.dirname, 'histoire/index.html'),
      },
    },
  },
})
