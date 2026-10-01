# สถานะเทียบ PRD

Implementation อยู่ใน repository; Supabase migration และ AI function ยังไม่ deploy จึงยังไม่ผ่าน live release gates และยังไม่ประกาศว่าผ่าน Definition of Done ทั้งหมด

| Requirement | สถานะในโค้ด / ข้อจำกัด |
|---|---|
| FR-01 | Supabase Auth, read RLS ทุกตารางส่วนตัว, ownership-checked RPC, ไม่มี client mutation grants |
| FR-02 | ข้อความ/PDF text layer, 20 MB/100k limits; binary PDF Storage ยังไม่มี |
| FR-03 | persisted queued/analyzing/ready/failed, lease และ retry เดิม; extracting เป็นขั้นตอน client, durable extraction queue ยังไม่มี |
| FR-04–05 | summary/concepts + chunk/excerpt, stable IDs ต่อ content; ตรวจ exact reference และ AI semantic review |
| FR-06 | structured bank สูงสุด 20, quiz สูงสุด 10, ตัวเลือก 4, server-only keys; ต้องตรวจ fixture คุณภาพจริง |
| FR-07–08 | server draft, resume, completeness, grading และ submit idempotency; มี DB tests |
| FR-09 | 3 recent attempts + distinct questions; sample count/insufficient evidence/thresholds มี tests |
| FR-10 | shared daily budget, timezone, enabled weekdays, target date/7-day horizon, backlog; ยังไม่มี budget รายวันต่างกัน |
| FR-11 | task statuses, reschedule, lock; completion ไม่เพิ่ม evidence |
| FR-12 | unused bank, prioritizes weak/insufficient concepts, shortage notice; ยังไม่มี generation เพิ่มเมื่อ bank หมด |
| FR-13 | version/inputs/reasons, started/locked preservation, rollback guard; ต้องเพิ่มรายละเอียด changed-task diff UI |
| FR-14 | attempt history, explanations, concept evidence, task count แยก; ยังไม่มี chart แนวโน้มราย concept |
| FR-15 | opt-in personal snapshot, hashed shell SW, offline activity events, replay/conflict recovery, logout purge; ต้องตรวจอุปกรณ์จริง |
| FR-16 | cascade source/summary/questions/attempts/issues + remove plan tasks/inputs/activity events + deletion ledger; ไม่มี binary files ใน implementation นี้ |

## Gate results ในเครื่อง

- TypeScript frontend + production Vite build: ผ่าน
- ESLint: ผ่าน
- Worker TypeScript: ผ่าน
- PostgreSQL/schema/validation tests: 16 ผ่าน
- localhost เปิดได้; width 360 ตรวจ DOM ไม่ overflow; UI ครบ flow ยังไม่ยืนยันเพราะ backend ยังไม่มี migration
- Supabase hosted RLS/transactions/concurrent retry, OpenAI live, PDF fixtures, mobile PWA/sync, WCAG, latency/performance: ยังไม่ยืนยัน

## งานก่อน pilot/production

- ใช้ migrations และ deploy function ตาม README แล้วทดสอบครบวงจรด้วยบัญชีสองคน
- เพิ่ม private binary PDF storage/deletion workflow, durable extraction/AI queue, content version editor, prerequisite handling และ availability รายวันตาม scope ที่ยืนยัน
- เพิ่ม generation bank เมื่อคำถามหมด และ UI diff การปรับแผน; ฟอร์มเปลี่ยนเป้าหมาย/วันสอบและ analytics ของการดูสรุปพร้อมแล้ว
- กิจกรรมที่ล็อก/เริ่มแล้วคงอยู่เมื่อเวลาว่างลดลง จึงอาจเกินความจุใหม่ ต้องปลดล็อก/เลื่อนหรือเพิ่มเวลา; กิจกรรมใหม่จะไม่เติมเกินความจุ
- AI reviewer เป็น heuristic ต้องตรวจ fixtures ไทย/อังกฤษ/ข้อความแฝงคำสั่งก่อน pilot
- Auth redirect/SMTP, Supabase staging + production, model และค่าใช้จ่าย, worker lifetime/queue, retention/backups/deletion SLA และ browser/device matrix ต้องยืนยันตาม PRD §16

ผู้ดูแลเรียก `lp_withdraw_question(question_uuid, reason)` ด้วย service-role เท่านั้น ห้ามส่ง service key ให้ frontend คำถามที่ถูกถอนออกจาก draft/evidence/feedback และสร้างแผนใหม่พร้อม trigger ที่ตรวจย้อนหลังได้
