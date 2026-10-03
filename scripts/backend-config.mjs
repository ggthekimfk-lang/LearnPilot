import { loadEnv } from 'vite'
import { configuredAppOrigins } from '../supabase/functions/_shared/app-origins.ts'

const env = loadEnv('production', process.cwd(), 'VITE_')
const hostname = new URL(env.VITE_SUPABASE_URL).hostname
if (!/^[a-z0-9]+\.supabase\.co$/.test(hostname)) throw new Error('Expected a Supabase project URL')
console.log(JSON.stringify({ projectRef: hostname.split('.')[0], origins: configuredAppOrigins }))
