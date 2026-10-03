import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  server: {
    proxy: env.VITE_SUPABASE_URL ? {
      '/__supabase/functions/v1/': {
        target: env.VITE_SUPABASE_URL,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/__supabase/, ''),
        configure(proxy) {
          // The browser calls this local same-origin route. Forward as a server
          // request so production APP_ORIGIN does not need every Vite port.
          // Supabase still verifies the user's Authorization header.
          proxy.on('proxyReq', proxyReq => proxyReq.removeHeader('origin'))
        },
      },
    } : undefined,
  },
  plugins: [react(), tailwindcss(), {
    name: 'leanpilot-shell',
    apply: 'build',
    writeBundle(options, bundle) {
      const assets = [...new Set(['/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable.png', '/favicon.svg', '/favicon.png', '/brand-mark-small.png', '/brand-mark.png', ...Object.keys(bundle).map(path => `/${path}`)])]
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 12)
      const target = resolve(options.dir || 'dist', 'sw.js')
      const source = readFileSync(resolve('public/sw.js'), 'utf8').replace('/* PRECACHE */ []', JSON.stringify(assets)).replace("/* VERSION */ 'development'", JSON.stringify(version))
      writeFileSync(target, source)
    },
  }],
  }
})
