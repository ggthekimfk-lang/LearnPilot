import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'leanpilot-shell',
    apply: 'build',
    writeBundle(options, bundle) {
      const assets = [...new Set(['/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable.png', '/favicon.svg', '/penguin/mascot.png', '/penguin/landscape.png', '/penguin/celebration.png', ...Object.keys(bundle).map(path => `/${path}`)])]
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 12)
      const target = resolve(options.dir || 'dist', 'sw.js')
      const source = readFileSync(resolve('public/sw.js'), 'utf8').replace('/* PRECACHE */ []', JSON.stringify(assets)).replace("/* VERSION */ 'development'", JSON.stringify(version))
      writeFileSync(target, source)
    },
  }],
})
