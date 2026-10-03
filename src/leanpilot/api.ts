import { createClient, FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'
import type { Snapshot } from './types'
import { functionUrl } from './function-url'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const client = url && key ? createClient(url, key, {
  global: {
    fetch: (input, init) => {
      // Keep SDK auth headers; local dev and preview use the same-origin proxy.
      const target = new URL(input instanceof Request ? input.url : String(input))
      const routed = functionUrl(target, url, window.location.origin)
      if (routed !== target.href) {
        return fetch(input instanceof Request ? new Request(routed, input) : routed, init)
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
    if (error.code === 'PGRST202') {
      const setup = 'กรุณาตรวจ SQL migrations ในโฟลเดอร์ supabase/migrations ตาม README'
      throw new Error(`Supabase ไม่พบฟังก์ชัน ${name} ใน schema cache ${setup} หากติดตั้งแล้วให้ reload schema และตรวจว่าเชื่อมต่อโปรเจกต์ถูกต้อง`)
    }
    if (error.code === '42P01') throw new Error(`Supabase พบตารางที่ยังไม่มีขณะเรียก ${name} กรุณาตรวจ SQL migrations ตาม README`)
    throw new Error(error.message)
  }
  return data as T
}
export async function loadSnapshot() {
  await rpc('lp_rebalance')
  return rpc<Snapshot>('lp_snapshot')
}
export async function analyze(id: string, mode: 'summary' | 'quiz' = 'summary') {
  if (!client || !navigator.onLine) throw new Error('การวิเคราะห์ต้องออนไลน์')
  const { data, error } = await client.functions.invoke('analyze-content', { body: { content_id: id, mode } })
  if (error instanceof FunctionsFetchError) {
    throw new Error('เชื่อมต่อบริการวิเคราะห์ไม่สำเร็จ กรุณาตรวจการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง')
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
