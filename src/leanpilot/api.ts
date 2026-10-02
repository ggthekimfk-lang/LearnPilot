import { createClient, FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'
import type { Snapshot } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const client = url && key ? createClient(url, key, {
  global: {
    fetch: (input, init) => {
      // Keep SDK auth headers; only Edge Function requests use the Vite dev proxy.
      const target = new URL(input instanceof Request ? input.url : String(input))
      if (import.meta.env.DEV && target.origin === new URL(url).origin && target.pathname.startsWith('/functions/v1/')) {
        const local = `/__supabase${target.pathname}${target.search}`
        return fetch(input instanceof Request ? new Request(new URL(local, window.location.origin), input) : local, init)
      }
      return fetch(input, init)
    },
  },
}) : null
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!client) throw new Error('กรุณาตั้งค่า Supabase ตาม README')
  if (!navigator.onLine) throw new Error('ต้องออนไลน์เพื่อทำรายการนี้')
  const { data, error } = await client.rpc(name, args)
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42P01') throw new Error('Supabase ยังไม่ได้ติดตั้ง schema LeanPilot กรุณาใช้ SQL migration ในโฟลเดอร์ supabase/migrations ตาม README แล้วโหลดหน้าใหม่')
    throw new Error(error.message)
  }
  return data as T
}
export async function loadSnapshot() {
  await rpc('lp_rebalance')
  return rpc<Snapshot>('lp_snapshot')
}
export async function analyze(id: string) {
  if (!client || !navigator.onLine) throw new Error('การวิเคราะห์ต้องออนไลน์')
  const { data, error } = await client.functions.invoke('analyze-content', { body: { content_id: id } })
  if (error instanceof FunctionsFetchError) {
    throw new Error('เชื่อมต่อ Edge Function ไม่สำเร็จ กรุณาตรวจเครือข่าย การ deploy analyze-content และ APP_ORIGIN ให้ตรงกับ URL ของหน้าเว็บ')
  }
  if (error instanceof FunctionsHttpError) {
    let message = `วิเคราะห์ไม่สำเร็จ (HTTP ${error.context.status})`
    try {
      const body = await error.context.json()
      if (typeof body?.error === 'string') message = body.error
    } catch {
      // Keep the HTTP status when the server response is not JSON.
    }
    throw new Error(message)
  }
  if (error || data?.error) throw new Error(data?.error || error?.message || 'วิเคราะห์ไม่สำเร็จ')
}
