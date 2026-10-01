import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const userA = '00000000-0000-0000-0000-000000000001'
const userB = '00000000-0000-0000-0000-000000000002'
let course, content, attempt, firstPlan
const call = async (sql, args = []) => (await db.query(sql, args)).rows[0]?.value
const rpc = (name, args = []) => call(`select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as value`, args)
const login = async id => { await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]) }
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    insert into auth.users values('${userA}'),('${userB}');`)
  for (const file of ['202609300001_leanpilot.sql', '202609300002_analysis.sql', '202609300003_plan_management.sql', '202609300004_question_review.sql']) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'))
  await login(userA)
})
after(async () => { await db.close() })

test('ownership, limits, and import idempotency', async () => {
  course = await rpc('lp_create_course', ['วิชาทดสอบ', 'เข้าใจเนื้อหา', null])
  content = '10000000-0000-0000-0000-000000000001'
  const source = 'TCP provides reliable transport and UDP is connectionless. '.repeat(12)
  await assert.rejects(rpc('lp_import', [course, 'สั้น', 'too short', content]))
  await rpc('lp_import', [course, 'Networking', source, content])
  await rpc('lp_import', [course, 'Networking', source, content])
  assert.equal((await rpc('lp_snapshot')).materials.length, 1)
  await login(userB)
  assert.equal((await rpc('lp_snapshot')).materials.length, 0)
  await assert.rejects(rpc('lp_import', [course, 'forbidden', source, '10000000-0000-0000-0000-000000000002']))
  await assert.rejects(rpc('lp_delete_content', [content]))
  await login(userA)
})
test('worker claim is leased and output is atomically published', async () => {
  await rpc('lp_claim_analysis', [content, userA, 'test-model'])
  await assert.rejects(rpc('lp_claim_analysis', [content, userA, 'test-model']))
  const reference = { section: 1, excerpt: 'TCP provides reliable transport' }
  const output = { summary: { overview: 'Transport', references: [reference], points: [{ text: 'TCP reliable', references: [reference] }] },
    concepts: [1, 2, 3].map(i => ({ id: `c${i}`, name: `Concept ${i}`, description: 'Transport', references: [reference] })),
    questions: Array.from({ length: 20 }, (_, i) => ({ concept_id: `c${i % 3 + 1}`, prompt: `Question ${i}`, choices: ['A', 'B', 'C', 'D'], correct: i % 4, explanation: 'Source explains this', reference })) }
  await rpc('lp_publish_analysis', [content, userA, output, 42])
  const snapshot = await rpc('lp_snapshot')
  assert.equal(snapshot.materials[0].status, 'ready')
  assert.equal(snapshot.materials[0].concepts[0].id, `${content}:c1`)
  assert.ok(snapshot.evidence.every(e => e.status === 'ยังประเมินไม่เพียงพอ'))
  assert.ok(!JSON.stringify(snapshot).includes('correct":0,"explanation'))
})
test('quiz draft has no answer key and cannot be accessed by another user', async () => {
  attempt = await rpc('lp_start_quiz', [content])
  assert.equal(await rpc('lp_start_quiz', [content]), attempt)
  const a = (await rpc('lp_snapshot')).attempts[0]
  assert.equal(a.questions.length, 10)
  assert.ok(a.questions.every(q => !('correct' in q) && !('explanation' in q)))
  await assert.rejects(rpc('lp_save_draft', [attempt, { [a.questions[0].id]: 4 }]))
  await assert.rejects(rpc('lp_save_draft', [attempt, { bogus: 1 }]))
  await rpc('lp_save_draft', [attempt, { [a.questions[0].id]: 2 }])
  assert.equal((await rpc('lp_snapshot')).attempts[0].answers[a.questions[0].id], 2)
  await assert.rejects(rpc('lp_submit_quiz', [attempt, {}]))
  await login(userB)
  await assert.rejects(rpc('lp_submit_quiz', [attempt, {}]))
  await login(userA)
})
test('server grading and plan generation are idempotent and fit capacity', async () => {
  const a = (await rpc('lp_snapshot')).attempts[0]
  const answers = Object.fromEntries(a.questions.map(q => [q.id, Number(q.prompt.split(' ')[1]) % 4]))
  const result = await rpc('lp_submit_quiz', [attempt, answers])
  assert.equal(result.score, 10)
  assert.deepEqual(await rpc('lp_submit_quiz', [attempt, {}]), result)
  const state = await rpc('lp_snapshot')
  assert.equal(state.plans.length, 1)
  firstPlan = state.plans[0]
  const days = {}
  for (const t of firstPlan.tasks) if (t.date) days[t.date] = (days[t.date] || 0) + t.minutes
  assert.ok(Object.values(days).every(minutes => minutes <= state.preferences.minutes))
  assert.equal(await call("select count(*)::int value from public.lp_analytics where event='quiz_submitted'"), 1)
})
test('new quiz avoids repeated questions and insufficient evidence remains qualified', async () => {
  const second = await rpc('lp_start_quiz', [content])
  const state = await rpc('lp_snapshot')
  const previous = state.attempts.find(a => a.id === attempt)
  const next = state.attempts.find(a => a.id === second)
  const previousIds = new Set(previous.questions.map(q => q.id))
  assert.ok(next.questions.every(q => !previousIds.has(q.id)))
  assert.ok(state.evidence.filter(e => e.sample < 3).every(e => e.status === 'ยังประเมินไม่เพียงพอ'))
  const answers = Object.fromEntries(next.questions.map(q => [q.id, 0]))
  await rpc('lp_submit_quiz', [second, answers])
  await assert.rejects(rpc('lp_start_quiz', [content]), /คำถามใหม่หมดแล้ว/)
})
test('locked and started activities survive replanning; completion does not change evidence', async () => {
  let state = await rpc('lp_snapshot')
  const plan = state.plans[0], task = plan.tasks.find(t => t.status === 'pending' && t.date)
  await rpc('lp_task_edit', [plan.id, task.id, task.date, true])
  await rpc('lp_preferences_save', [{ minutes: 10, timezone: 'Asia/Bangkok', days: [0,1,2,3,4,5,6], language: 'th' }])
  state = await rpc('lp_snapshot')
  assert.ok(state.plans[0].tasks.some(t => t.id === task.id && t.locked))
  assert.ok(state.plans[0].tasks.some(t => !t.date))
  const before = state.evidence
  const event = '20000000-0000-0000-0000-000000000001'
  await rpc('lp_task_event', [event, state.plans[0].id, task.id, 'completed'])
  await rpc('lp_task_event', [event, state.plans[0].id, task.id, 'completed'])
  await rpc('lp_task_event', ['20000000-0000-0000-0000-000000000002', state.plans[0].id, task.id, 'skipped'])
  assert.equal((await rpc('lp_snapshot')).plans[0].tasks.find(t => t.id === task.id).status, 'completed')
  assert.deepEqual((await rpc('lp_snapshot')).evidence, before)
  await assert.rejects(rpc('lp_undo_plan', [state.plans[0].id]))
})
test('table RLS and function grants deny cross-user reads and private answer keys', async () => {
  await login(userB)
  await db.exec('set role authenticated')
  assert.equal((await db.query('select * from public.lp_content')).rows.length, 0)
  await assert.rejects(db.query('select * from lp_private.questions'))
  await assert.rejects(rpc('lp_claim_analysis', [content, userA, 'test-model']))
  await assert.rejects(db.query("update public.lp_attempts set result='{}'"))
  await db.exec('reset role')
  await login(userA)
})
test('offline completion survives a replaced plan task and replay is harmless', async () => {
  const oldTask = firstPlan.tasks.find(t => t.kind === 'quiz')
  const event = '20000000-0000-0000-0000-000000000003'
  assert.equal(await rpc('lp_task_event', [event, firstPlan.id, oldTask.id, 'completed']), false)
  assert.ok((await rpc('lp_snapshot')).plans[0].tasks.some(t => t.id === oldTask.id && t.status === 'completed'))
  await rpc('lp_task_event', [event, firstPlan.id, oldTask.id, 'completed'])
  assert.equal(await call('select count(*)::int value from public.lp_activity_events where id=$1', [event]), 1)
})
test('missed tasks are rescheduled once without changing started tasks', async () => {
  await rpc('lp_preferences_save', [{ minutes: 30, timezone: 'Asia/Bangkok', days: [0,1,2,3,4,5,6], language: 'th' }])
  let state = await rpc('lp_snapshot')
  const p = state.plans[0]
  await db.query("update public.lp_plans set tasks=(select jsonb_agg(case when t->>'status'='pending' and not (t->>'locked')::boolean then jsonb_set(t,'{date}',to_jsonb('2000-01-01'::text)) else t end) from jsonb_array_elements(tasks) t) where id=$1", [p.id])
  await rpc('lp_rebalance')
  state = await rpc('lp_snapshot')
  assert.ok(state.plans[0].version > p.version)
  assert.ok(state.plans[0].tasks.filter(t => t.status === 'pending' && !t.locked).every(t => !t.date || t.date > '2000-01-01'))
  const v = state.plans[0].version
  await rpc('lp_rebalance')
  assert.equal((await rpc('lp_snapshot')).plans[0].version, v)
})
test('multiple courses share one daily capacity and plan history is preserved', async () => {
  const c = await rpc('lp_create_course', ['Second course', 'Shared time', null])
  const id = '10000000-0000-0000-0000-000000000003'
  const reference = { section: 1, excerpt: 'Reliable transport' }
  await rpc('lp_import', [c, 'Second material', 'Reliable transport is important. '.repeat(10), id])
  await rpc('lp_claim_analysis', [id, userA, 'test-model'])
  await rpc('lp_publish_analysis', [id, userA, { summary: { overview: 'Reliable', references: [reference], points: [{ text: 'Transport', references: [reference] }] }, concepts: [{ id: 'c1', name: 'Other concept', description: 'Transport', references: [reference] }], questions: [1,2,3].map(i => ({ concept_id: 'c1', prompt: `Second question ${i}`, choices: ['a','b','c','d'], correct: 0, explanation: 'Reliable', reference })) }, 1])
  const next = await rpc('lp_start_quiz', [id])
  const a = (await rpc('lp_snapshot')).attempts.find(a => a.id === next)
  await rpc('lp_submit_quiz', [next, Object.fromEntries(a.questions.map(q => [q.id, 0]))])
  await rpc('lp_preferences_save', [{ minutes: 30, timezone: 'Asia/Bangkok', days: [0,1,2,3,4,5,6], language: 'th' }])
  const state = await rpc('lp_snapshot'), days={}
  state.plans.flatMap(p => p.tasks).forEach(t => { if (t.date && t.status !== 'skipped') days[t.date]=(days[t.date] || 0)+t.minutes })
  assert.ok(Object.values(days).every(m => m<=30))
  const original = await call('select tasks value from public.lp_plans where id=$1', [firstPlan.id])
  assert.deepEqual(original, firstPlan.tasks)
  await rpc('lp_delete_content', [id])
})
test('withdrawing a confirmed bad question recomputes evidence and plans once', async () => {
  const state=await rpc('lp_snapshot'), a=state.attempts.find(a=>a.id===attempt)
  const q=a.questions[0].id
  await rpc('lp_withdraw_question',[q,'Incorrect question confirmed by review'])
  const next=await rpc('lp_snapshot')
  assert.equal(next.attempts.find(a=>a.id===attempt).result.total,9)
  assert.equal(next.attempts.find(a=>a.id===attempt).result.withdrawn_count,1)
  assert.equal(next.evidence.reduce((s,e)=>s+e.sample,0),19)
  const version=next.plans.find(p=>p.course_id===course).version
  await rpc('lp_withdraw_question',[q,'Duplicate request'])
  assert.equal((await rpc('lp_snapshot')).plans.find(p=>p.course_id===course).version,version)
})
test('deletion removes derivative data and future plan tasks', async () => {
  await rpc('lp_delete_content', [content])
  const state = await rpc('lp_snapshot')
  assert.equal(state.materials.length, 0)
  assert.equal(state.attempts.length, 0)
  assert.equal(state.evidence.length, 0)
  assert.ok(state.plans.every(p => p.tasks.every(t => t.content_id !== content)))
  assert.equal(await call('select count(*)::int value from lp_private.questions'), 0)
  assert.equal(await call('select count(*)::int value from public.lp_deletions where content_id=$1', [content]), 1)
})
