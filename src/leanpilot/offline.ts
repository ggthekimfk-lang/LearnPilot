import type { Snapshot, Task } from './types'
type Event = { id: string; task_id: string; status: Task['status']; plan_id: string }
const prefix = 'leanpilot:'
const key = (user: string, name: string) => `${prefix}${user}:${name}`
export function readSaved(user: string): Snapshot | null {
  try { return JSON.parse(localStorage.getItem(key(user, 'saved')) || 'null') } catch { return null }
}
export function saveOffline(user: string, snapshot: Snapshot) {
  // Never save questions, drafts, answer keys, or feedback in offline downloads.
  localStorage.setItem(key(user, 'saved'), JSON.stringify({ ...snapshot, attempts: [] }))
}
export function events(user: string): Event[] {
  try { return JSON.parse(localStorage.getItem(key(user, 'events')) || '[]') } catch { return [] }
}
export function queueEvent(user: string, task_id: string, status: Task['status'], plan_id: string) {
  const event = { id: crypto.randomUUID(), task_id, status, plan_id }
  localStorage.setItem(key(user, 'events'), JSON.stringify([...events(user), event]))
}
export function removeEvent(user: string, id: string) {
  localStorage.setItem(key(user, 'events'), JSON.stringify(events(user).filter(e => e.id !== id)))
}
export function clearPrivate() {
  Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k))
  Object.keys(sessionStorage).filter(k => k.startsWith(prefix)).forEach(k => sessionStorage.removeItem(k))
}
