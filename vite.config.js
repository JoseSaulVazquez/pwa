import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync } from 'fs'

function copyPWAAssets() {
  return {
    name: 'copy-pwa-assets',
    closeBundle() {
      const publicFiles = [
        'public/sw.js',
        'public/manifest.json',
      ]
      publicFiles.forEach((file) => {
        const src = resolve(__dirname, file)
        const dest = resolve(__dirname, 'dist', file.replace('public/', ''))
        if (existsSync(src)) {
          copyFileSync(src, dest)
          console.log(`✅ Copiado ${file} a dist/`)
        } else {
          console.warn(`⚠️ No se encontró ${file}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), copyPWAAssets()],
  server: {
    host: true,
    port: 5173,
  },
})
