// Reflect only an exact configured frontend origin, never an arbitrary request origin.
export function corsHeaders(request: Request, configured = 'http://localhost:5173'): Record<string, string> {
  const allowed = configured.split(',').map(value => value.trim()).filter(value => {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && url.origin === value }
    catch { return false }
  })
  const origin = request.headers.get('Origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}
