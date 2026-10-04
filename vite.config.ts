import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { devPort, previewPort } from './supabase/functions/_shared/app-origins.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
  // Keep the app and its PDF worker parseable on older iPhones and Androids.
  build: { target: ['chrome92', 'edge92', 'firefox90', 'safari15.4'] },
  worker: {
    format: 'es',
    plugins: () => [{
      name: 'pdf-worker-fallback-export',
      renderChunk(code, chunk) {
        // Vite strips worker entry exports. PDF.js dynamically imports this
        // same URL for its fallback, so expose the handler after bundling.
        if (chunk.facadeModuleId?.replaceAll('\\', '/').endsWith('/pdf.worker.ts')) {
          return `${code}\nconst pdfFallbackHandler = globalThis.pdfjsWorker.WorkerMessageHandler;\nexport { pdfFallbackHandler as WorkerMessageHandler };\n`
        }
      },
    }],
  },
  server: {
    port: devPort,
    strictPort: true,
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
  // Vite preview inherits server.proxy, including the authenticated function proxy.
  preview: { port: previewPort, strictPort: true },
  plugins: [react(), tailwindcss(), {
    name: 'pdf-support-assets',
    configureServer(server) {
      const assets = new Map<string, string>()
      for (const folder of ['cmaps', 'standard_fonts']) {
        const dir = resolve('node_modules/pdfjs-dist', folder)
        for (const name of readdirSync(dir)) {
          if (/\.(bcmap|pfb|ttf)$/.test(name)) assets.set(`/pdfjs/${folder}/${name}`, resolve(dir, name))
        }
      }
      server.middlewares.use((req, res, next) => {
        const path = assets.get((req.url || '').split('?')[0])
        if (!path) return next()
        res.setHeader('Content-Type', 'application/octet-stream')
        res.end(readFileSync(path))
      })
    },
    generateBundle() {
      for (const folder of ['cmaps', 'standard_fonts']) {
        const dir = resolve('node_modules/pdfjs-dist', folder)
        for (const name of readdirSync(dir)) {
          if (/\.(bcmap|pfb|ttf)$/.test(name) || name.startsWith('LICENSE')) this.emitFile({ type: 'asset', fileName: `pdfjs/${folder}/${name}`, source: readFileSync(resolve(dir, name)) })
        }
      }
    },
  }, {
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
