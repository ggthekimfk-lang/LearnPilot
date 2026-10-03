// Vite dev and preview both provide this same-origin proxy. Public deployments
// call Supabase directly and are checked against APP_ORIGIN by the backend.
export function functionUrl(target: URL, supabaseUrl: string, frontendOrigin: string): string {
  const frontend = new URL(frontendOrigin)
  if (['localhost', '127.0.0.1', '[::1]'].includes(frontend.hostname)
      && target.origin === new URL(supabaseUrl).origin
      && target.pathname.startsWith('/functions/v1/')) {
    return new URL(`/__supabase${target.pathname}${target.search}`, frontendOrigin).href
  }
  return target.href
}
