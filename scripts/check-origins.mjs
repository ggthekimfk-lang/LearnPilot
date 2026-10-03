import { loadEnv } from 'vite'
import { pathToFileURL } from 'node:url'
import { appOrigins } from '../supabase/functions/_shared/app-origins.ts'

export async function checkOrigins(endpoint, origins = appOrigins) {
  for (const origin of [...origins, 'https://evil.example', `${new URL(origins[0]).origin}.evil.example`, 'http://localhost:3000', 'null']) {
    const response = await fetch(endpoint, {
      method: 'OPTIONS',
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info' },
      signal: AbortSignal.timeout(15000),
    })
    const allowed = response.headers.get('access-control-allow-origin')
    if (origins.includes(origin)) {
      const headers = (response.headers.get('access-control-allow-headers') || '').toLowerCase().split(',').map(s => s.trim())
      const methods = (response.headers.get('access-control-allow-methods') || '').split(',').map(s => s.trim())
      if (!response.ok || allowed !== origin || !methods.includes('POST') || !['authorization', 'apikey', 'content-type', 'x-client-info'].every(h => headers.includes(h))) {
        throw new Error(`APP_ORIGIN mismatch: ${origin} (HTTP ${response.status}, allowed=${allowed})`)
      }
    } else if (response.status !== 403 || allowed !== null) {
      throw new Error(`Untrusted origin was not rejected: ${origin} (HTTP ${response.status}, allowed=${allowed})`)
    }
    console.log(`PASS ${origin} (HTTP ${response.status})`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = loadEnv('production', process.cwd(), 'VITE_')
  if (!env.VITE_SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL')
  await checkOrigins(new URL('/functions/v1/analyze-content', env.VITE_SUPABASE_URL))
}
