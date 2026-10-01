import { createClient } from '@supabase/supabase-js'
import type { Snapshot } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const client = url && key ? createClient(url, key) : null
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
  if (error || data?.error) throw new Error(data?.error || error?.message || 'วิเคราะห์ไม่สำเร็จ')
}
