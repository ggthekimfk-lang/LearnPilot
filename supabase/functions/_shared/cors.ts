import { configuredAppOrigins } from './app-origins.ts'

// Normalize URL spelling (including a trailing slash), but never accept paths,
// credentials, wildcards or arbitrary request origins.
export function corsHeaders(request: Request, configured = configuredAppOrigins): Record<string, string> {
  const allowed = configured.split(',').map(value => value.trim()).filter(value => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password }
    catch { return false }
  }).map(value => new URL(value).origin)
  const origin = request.headers.get('Origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}
