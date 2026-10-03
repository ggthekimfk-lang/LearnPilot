# LeanPilot PWA

แอปตาม [PRD](docs/PRD-LeanPilot-PWA.md): เพิ่ม PDF/TEXT → สรุปบทเรียน → quiz → หลักฐานราย concept → แผนตามเวลาว่าง → ทบทวนและทดสอบใหม่

ใช้ React/TypeScript/Vite, Supabase Auth/Postgres และ Supabase Edge Function สำหรับ Gemini API แอปเริ่มที่ `src/leanpilot/LeanPilot.tsx`; เก็บหน้า prototype เดิมไว้เพื่อไม่ทับงานก่อนหน้า แต่ไม่ใช้ข้อมูลตัวอย่างเดิมให้คะแนน

## เริ่มพัฒนา

ใช้ Node.js 24+ เพื่อรัน tests ที่ import TypeScript โดยตรง

```sh
npm install
```

คัดลอก `.env.example` เป็น `.env` แล้วใส่ URL และ **publishable key** ของ Supabase ห้ามใส่ service-role/Gemini key ใน `VITE_*`

```sh
npm run dev
npm run build
npm run lint
npm test
npm run typecheck:worker
```

## ตั้งค่า backend

**Migration ยังไม่ได้ใช้กับ Supabase ที่เชื่อมอยู่** หากพบว่าไม่พบ `lp_snapshot`/`lp_rebalance` ให้ทำขั้นตอนนี้ก่อนสร้างวิชา

1. ใช้โปรเจกต์ staging ที่จัดการได้ เปิด Email/Password Auth และตั้ง redirect URL ของ frontend
2. รัน SQL ใน `supabase/migrations` ตามลำดับ `001` → `002` → `003` → `004` → `005` → `006` → `007` → `008` → `009` **ครั้งเดียว** ผ่าน SQL Editor หรือใช้ CLI workflow ด้านล่าง ตารางใหม่ใช้ prefix `lp_*` และไม่แก้ตาราง prototype เดิม
3. สร้าง API key ที่ [Google AI Studio](https://aistudio.google.com/apikey) ตั้ง server secrets และ deploy `analyze-content`:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set GEMINI_API_KEY=YOUR_SERVER_KEY GEMINI_MODEL=YOUR_MODEL APP_ORIGIN=https://YOUR_FRONTEND_ORIGIN
supabase functions deploy analyze-content
```

ใช้ `db push` เมื่อยังไม่ได้ใช้ SQL Editor หรือบันทึก migration history ให้ตรงก่อน push อย่ารันทั้งสองวิธีซ้ำ เลือก `GEMINI_MODEL` ที่บัญชีเข้าถึงได้และรองรับ Gemini structured output ไม่ตั้งค่าโมเดลหรือค่าใช้จ่ายแทนผู้ดูแล

Local development ใช้ `APP_ORIGIN=http://localhost:5173` หรือ origin ที่เปิดจริง (รวม port) Production ต้องเป็น HTTPS `verify_jwt=false` ใน function config เพราะ function ตรวจ bearer token ด้วย `auth.getUser` เองทุก request Worker ใช้ service role ภายใน environment ของ Supabase เท่านั้น

`npm run dev` ส่งคำขอ Edge Function ผ่าน Vite proxy บน origin เดียวกับหน้าเว็บ จึงรองรับ port ที่ Vite เลือก เช่น 5176 โดยยังส่ง token ของผู้ใช้ตามปกติ หากแก้ config แล้ว server ไม่ restart ให้เริ่ม `npm run dev` ใหม่ Production และ `npm run preview` เรียก Supabase โดยตรง จึงต้องตั้ง `APP_ORIGIN` ให้ตรงกับ origin ที่ใช้งานจริง

Structured output อ้างอิง [Gemini official documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)

## ฟังก์ชันในโค้ด

- บัญชีส่วนตัว วิชา/เป้าหมาย เพิ่มข้อความ/PDF text layer จำกัด 20 MB, 100,000 ตัวอักษร และขั้นต่ำ 200 ตัวอักษร
- งานวิเคราะห์บันทึกสถานะ/retry/lease/model/prompt version/latency ตรวจ schema, exact excerpt และ semantic review แยกก่อนเผยแพร่แบบ transaction สูงสุด 3 generation attempts ต่อเอกสาร
- สรุปบทเรียนแสดงภาพรวม หัวข้อสำคัญ และสิ่งที่ควรจำ
- Upload TEXT UTF-8 เพิ่มจากการวางข้อความ จำกัดไฟล์ 1 MB และ source 100,000 ตัวอักษร
- quiz draft บน server; client ไม่ได้รับ keys/explanations ก่อนส่ง; grading/check-completeness/idempotency ฝั่ง server
- หลักฐานจากคำถามไม่ซ้ำใน 3 attempts ล่าสุด เกณฑ์ข้อมูลอย่างน้อย 3 ข้อ และคะแนนกิจกรรมแยกจากผลทดสอบ
- แผนเวอร์ชัน/inputs/เหตุผล จำกัดเวลาร่วมกันหลายวิชา ล็อก/เลื่อน/ข้าม/เริ่ม/เสร็จ/rollback และจัดงานที่พลาดใหม่เมื่อออนไลน์
- PWA manifest/PNG icons/hashed shell precache/update notice; opt-in offline summary/source/plan; ไม่ดาวน์โหลด quiz/เฉลยสำหรับ offline; event UUID และ stale completion recovery; logout purge
- ลบเนื้อหาและอนุพันธ์พร้อม deletion ledger รายงานข้อผิดได้ ผู้ดูแลถอนคำถามผ่าน service-only RPC เพื่อคำนวณคะแนน/evidence/แผนใหม่
- Server analytics สำหรับ import/analysis/quiz/plan/task/cycle/report ไม่ส่งต้นฉบับไป analytics

## ตรวจสอบ

`npm test` ใช้ PGlite (PostgreSQL ใน WASM) สร้างฐานข้อมูลแยกและ mock เฉพาะ Supabase Auth identity ไม่อ่านหรือเปลี่ยนข้อมูลจริง มี tests รวม PDF.js parser และ provider mock สำหรับ ownership/RLS/grants, import/draft/submit idempotency, key isolation, evidence, capacity/multiple courses, preserved history, missed tasks, offline conflicts, withdrawal/deletion และ output validation

Build, lint และ worker typecheck ต้องผ่านด้วย Tests นี้ยังไม่แทน Supabase/AI live, hosted concurrency หรืออุปกรณ์จริง

## ข้อจำกัดก่อน pilot

ยังไม่ผ่าน Definition of Done ทั้งหมด ดู [สถานะเทียบ PRD](docs/IMPLEMENTATION-STATUS.md)

- PDF เก็บข้อความที่แยกพร้อมเลขหน้า ยังไม่มี binary original/private Storage/PDF viewer
- Worker ใช้ `EdgeRuntime.waitUntil` + persisted lease ไม่ใช่ durable queue หาก runtime ยุติต้องลองใหม่หลัง lease 5 นาที ไม่มี automatic retry scheduler
- Question bank สูงสุด 20 ข้อต่อเอกสาร ใช้ข้อใหม่ชุดละสูงสุด 10 เมื่อหมดแจ้งข้อจำกัด ยังไม่ generate bank เพิ่ม
- ยังไม่มี content version editor, prerequisite inference, daily budgets ต่างกัน หรือ admin UI
- Locked/started tasks คงอยู่เมื่อลดเวลาว่างและอาจเกินความจุใหม่ ต้องปลดล็อก/เลื่อนหรือเพิ่มเวลา
- AI semantic reviewer เป็น heuristic ต้องตรวจคุณภาพไทย/อังกฤษ/เนื้อหาแฝงคำสั่ง และกำหนด model/budget/retention/provider backups ก่อน production
- ต้องทดสอบ installation/offline/update/logout/sync บนอุปกรณ์จริง, WCAG 2.2 AA และวัด LCP/AI p95 ตาม PRD

## ทดลองครบวงจรเมื่อ backend พร้อม

สมัคร/ยืนยันอีเมล → ตั้งเวลาในเมนูบัญชี → สร้างวิชา → เพิ่มเนื้อหา → รอวิเคราะห์เสร็จ → อ่านสรุปบทเรียน → สร้างแบบทดสอบ → ส่ง quiz → ดูหลักฐานและแผน → เริ่มทบทวน/บันทึกเสร็จ → เริ่มกิจกรรม quiz/ส่งชุดใหม่ → ตรวจแผนเวอร์ชันใหม่

Offline ใช้ **production build** (`npm run build` + `npm run preview`): เปิดออนไลน์หนึ่งครั้ง → บันทึกข้อมูลในตั้งค่า → ตัดเครือข่าย → เปิด summary/plan และบันทึกกิจกรรม → ต่อเครือข่ายและตรวจ sync → logout แล้วตรวจ purge


### Update for safety fixes (migration 005)

For an existing database with migrations 001-004 installed, apply only
`supabase/migrations/202610020005_safety_fixes.sql`, then deploy the updated
`analyze-content` function. This migration changes publish/fail RPC signatures
and requires the matching worker. Schedule the update when no analysis is running;
interrupted jobs can be retried after their five-minute lease expires.
The migration also rejects null or malformed preferences.


### Recover exhausted retries after Gemini HTTP 503 (migration 006)

Apply migrations 005 and 006 in order, and deploy the matching worker from this
repository. Migration 006 restores one retry for the latest recorded Gemini 503
failure and makes future 503 failures refund their claim. Validation failures
still consume the three-attempt budget. Recovery does not delete content or
reset earlier failures; replaying migration 006 does not refund twice.



## Quiz recovery fixes (migration 009)

Apply migrations through 008, then apply `supabase/migrations/202610030009_quiz_availability.sql` and deploy the updated frontend. Migration 009 prevents exhausted banks from scheduling retests, repairs affected active plans while retaining historical versions, and prevents rollback to unavailable quizzes. It does not generate questions or call Gemini; the worker needs no changes.

Unsaved quiz selections are stored per user and attempt in sessionStorage in the current browser tab, without questions or answer keys. Reopening or refreshing the same tab restores pending selections; retry saving when online. Confirmed saves/submissions and logout remove these selections. Closing the tab may lose unsaved selections, so the app warns before unloading; storage restrictions can also prevent recovery.

## ทบทวนหัวข้อจากผลทดสอบ (ไม่เรียก AI เพิ่ม)

หลังส่ง quiz หรือเปิดผลย้อนหลัง จะมีการ์ดหัวข้อที่ตอบผิดพร้อมจำนวนข้อผิด/ข้อทั้งหมดในชุดนี้ กด “ทบทวนเนื้อหา” เพื่ออ่านคำอธิบาย concept แหล่งอ้างอิง และข้อผิดพร้อมเฉลยเดิม กด “อ่านสรุปบทเรียนเต็ม” เพื่อกลับบทเรียน ฟีเจอร์นี้ไม่มี provider calls, ไม่มีการสร้างคำถามใหม่ และไม่เพิ่มคะแนนความเข้าใจจากการเปิดอ่าน ไม่ต้องเพิ่ม environment variables หรือ migration สำหรับส่วนทบทวนนี้

ทดสอบด้วยผลที่มีข้อผิดหลายหัวข้อ ผลที่ตอบถูกทั้งหมด และผลที่ถูกถอนคำถามจนไม่มีข้อประเมิน ระบบต้องไม่สร้างหัวข้อจุดอ่อนที่ไม่มีหลักฐาน
