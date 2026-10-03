// Single source for APP_ORIGIN deployment and local frontend routing.
export const appOrigins = [
  'https://learn-pilot-blush.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]
export const configuredAppOrigins = appOrigins.join(',')
export const devPort = 5173
export const previewPort = 4173
