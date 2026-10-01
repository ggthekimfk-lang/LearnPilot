# LeanPilot PWA

แอปตาม [PRD](docs/PRD-LeanPilot-PWA.md): เพิ่มเนื้อหา → สรุปพร้อมอ้างอิง → quiz → หลักฐานราย concept → แผนตามเวลาว่าง → ทบทวนและทดสอบใหม่

ใช้ React/TypeScript/Vite, Supabase Auth/Postgres และ Supabase Edge Function สำหรับ OpenAI Responses API แอปเริ่มที่ `src/leanpilot/LeanPilot.tsx`; เก็บหน้า prototype เดิมไว้เพื่อไม่ทับงานก่อนหน้า แต่ไม่ใช้ข้อมูลตัวอย่างเดิมให้คะแนน

## เริ่มพัฒนา

ใช้ Node.js 24+ เพื่อรัน tests ที่ import TypeScript โดยตรง

```sh
npm install
```

คัดลอก `.env.example` เป็น `.env` แล้วใส่ URL และ **publishable key** ของ Supabase ห้ามใส่ service-role/OpenAI key ใน `VITE_*`

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
2. รัน SQL ใน `supabase/migrations` ตามลำดับ `001` → `002` → `003` → `004` **ครั้งเดียว** ผ่าน SQL Editor หรือใช้ CLI workflow ด้านล่าง ตารางใหม่ใช้ prefix `lp_*` และไม่แก้ตาราง prototype เดิม
3. Deploy `analyze-content` และตั้ง server secrets:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy analyze-content
supabase secrets set OPENAI_API_KEY=YOUR_SERVER_KEY OPENAI_MODEL=YOUR_MODEL APP_ORIGIN=https://YOUR_FRONTEND_ORIGIN
```

ใช้ `db push` เมื่อยังไม่ได้ใช้ SQL Editor หรือบันทึก migration history ให้ตรงก่อน push อย่ารันทั้งสองวิธีซ้ำ เลือก `OPENAI_MODEL` ที่บัญชีเข้าถึงได้และรองรับ Responses structured output ไม่ตั้งค่าโมเดลหรือค่าใช้จ่ายแทนผู้ดูแล

Local development ใช้ `APP_ORIGIN=http://localhost:5173` หรือ origin ที่เปิดจริง (รวม port) Production ต้องเป็น HTTPS `verify_jwt=false` ใน function config เพราะ function ตรวจ bearer token ด้วย `auth.getUser` เองทุก request Worker ใช้ service role ภายใน environment ของ Supabase เท่านั้น

Structured output อ้างอิง [OpenAI official documentation](https://developers.openai.com/api/docs/guides/structured-outputs)

## ฟังก์ชันในโค้ด

- บัญชีส่วนตัว วิชา/เป้าหมาย เพิ่มข้อความ/PDF text layer จำกัด 20 MB, 100,000 ตัวอักษร และขั้นต่ำ 200 ตัวอักษร
- งานวิเคราะห์บันทึกสถานะ/retry/lease/model/prompt version/latency ตรวจ schema, exact excerpt และ semantic review แยกก่อนเผยแพร่แบบ transaction สูงสุด 3 generation attempts ต่อเอกสาร
- สรุป/concepts เปิด excerpt และส่วนต้นฉบับได้; ข้อความจาก PDF มี marker เลขหน้า
- quiz draft บน server; client ไม่ได้รับ keys/explanations ก่อนส่ง; grading/check-completeness/idempotency ฝั่ง server
- หลักฐานจากคำถามไม่ซ้ำใน 3 attempts ล่าสุด เกณฑ์ข้อมูลอย่างน้อย 3 ข้อ และคะแนนกิจกรรมแยกจากผลทดสอบ
- แผนเวอร์ชัน/inputs/เหตุผล จำกัดเวลาร่วมกันหลายวิชา ล็อก/เลื่อน/ข้าม/เริ่ม/เสร็จ/rollback และจัดงานที่พลาดใหม่เมื่อออนไลน์
- PWA manifest/PNG icons/hashed shell precache/update notice; opt-in offline summary/source/plan; ไม่ดาวน์โหลด quiz/เฉลยสำหรับ offline; event UUID และ stale completion recovery; logout purge
- ลบเนื้อหาและอนุพันธ์พร้อม deletion ledger รายงานข้อผิดได้ ผู้ดูแลถอนคำถามผ่าน service-only RPC เพื่อคำนวณคะแนน/evidence/แผนใหม่
- Server analytics สำหรับ import/analysis/quiz/plan/task/cycle/report ไม่ส่งต้นฉบับไป analytics

## ตรวจสอบ

`npm test` ใช้ PGlite (PostgreSQL ใน WASM) สร้างฐานข้อมูลแยกและ mock เฉพาะ Supabase Auth identity ไม่อ่านหรือเปลี่ยนข้อมูลจริง มี 16 tests สำหรับ ownership/RLS/grants, import/draft/submit idempotency, key isolation, evidence, capacity/multiple courses, preserved history, missed tasks, offline conflicts, withdrawal/deletion และ output validation

Build, lint และ worker typecheck ต้องผ่านด้วย Tests นี้ยังไม่แทน Supabase/AI live, hosted concurrency, PDF fixtures หรืออุปกรณ์จริง

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

สมัคร/ยืนยันอีเมล → ตั้งเวลาในเมนูบัญชี → สร้างวิชา → เพิ่มเนื้อหา → รอพร้อมเรียน → เปิด references → ส่ง quiz → ดูหลักฐานและแผน → เริ่มทบทวน/บันทึกเสร็จ → เริ่มกิจกรรม quiz/ส่งชุดใหม่ → ตรวจแผนเวอร์ชันใหม่

Offline ใช้ **production build** (`npm run build` + `npm run preview`): เปิดออนไลน์หนึ่งครั้ง → บันทึกข้อมูลในตั้งค่า → ตัดเครือข่าย → เปิด summary/plan และบันทึกกิจกรรม → ต่อเครือข่ายและตรวจ sync → logout แล้วตรวจ purge
