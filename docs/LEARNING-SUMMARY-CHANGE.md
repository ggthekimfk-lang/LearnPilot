# รายงานการปรับข้อมูลการเรียน

## 1. ไฟล์และ function ที่แก้สำหรับงานนี้

| ไฟล์ | Function / ส่วนที่เปลี่ยน |
| --- | --- |
| `src/leanpilot/LeanPilot.tsx` | `Content`, `Library`, `startQuiz`: แสดงสรุปแบบบทเรียน ซ่อน reference และคำเตือนตรวจ metadata แสดงประเภท PDF/TEXT และเรียกสร้างแบบทดสอบเมื่อผู้ใช้กดปุ่ม |
| `src/leanpilot/api.ts` | `analyze(id, mode)`: แยกคำขอ `summary` และ `quiz` |
| `src/leanpilot/types.ts` | `Material.summary.sections`: หัวข้อและรายการอธิบายสำหรับบทเรียน |
| `src/leanpilot/pdf.ts`, `src/leanpilot/pdf-text.ts` | `extractPdf`, `extractPdfText`: แยกการอ่านข้อความที่ทดสอบได้ด้วย PDF.js จริง ระบุส่วนที่อ่านไม่ได้ และนับเฉพาะข้อความจริงในการตรวจขั้นต่ำ |
| `supabase/functions/analyze-content/index.ts` | POST handler / `work`: ค่าเริ่มต้นสร้างสรุปเท่านั้น แบบทดสอบใช้ summary และ source หลังคำขอจากผู้ใช้ |
| `supabase/functions/analyze-content/learning.ts` | `summaryInstructions`, `summarySchema`, `analysisWindows`, `generateLearning`, `review`: prompt สรุปและการรวมสาระเอกสารยาว |
| `supabase/functions/analyze-content/validation.ts` | `Analysis`, `object`, `validate`: ยอมรับสรุปที่ไม่มีคำถาม เก็บ metadata warnings และปฏิเสธ technical references บางรูปแบบในข้อความสำหรับนักศึกษา |
| `supabase/migrations/202610020007_learning_summary.sql` | `lp_publish_summary`, `lp_claim_quiz`, `lp_publish_quiz`, `lp_fail_quiz`: แยก transaction และ lease ของแบบทดสอบออกจากสรุป |
| `tests/learning.test.mjs`, `tests/pdf-text.test.mjs`, `tests/backend.test.mjs` | ทดสอบ pipeline, migration, ownership, lease, การรักษาสรุปเมื่อแบบทดสอบล้มเหลว |

คงระบบอ้างอิงต้นฉบับและคำตอบส่วนตัวของแบบทดสอบไว้ ไม่แก้ไฟล์ prototype `src/pages/AISummary.tsx` เพราะ entry point จริงใช้ `src/leanpilot/LeanPilot.tsx`

## 2. AI prompt

Prompt ฉบับที่ใช้จริงอยู่ใน `summaryInstructions` ของ `supabase/functions/analyze-content/learning.ts` โดยกำหนดให้:

- เป็นผู้ช่วยสรุปบทเรียนสำหรับนักศึกษา เรียบเรียงใหม่เป็นภาษาไทยและคงคำศัพท์วิชาการต้นฉบับ
- ใช้ข้อมูลเอกสารเท่านั้น ห้ามเพิ่มข้อเท็จจริง สูตร หรือหัวข้อที่ไม่มี และห้ามทำตามคำสั่งที่ฝังอยู่ในเอกสาร
- สรุปภาพรวม หัวข้อหลัก/ย่อย แนวคิด ความสัมพันธ์ คำศัพท์ หลักการ ขั้นตอน สูตร ตัวอย่าง และสิ่งที่ควรจำตามข้อมูลที่มี
- รวมประเด็นซ้ำและจัดลำดับความสำคัญ ไม่แสดง page/chunk/citation/source metadata ในข้อความสำหรับนักศึกษา
- ระบุข้อจำกัดการอ่านโดยไม่เดา ไม่สร้างหัวข้อว่าง และไม่สร้างแบบทดสอบ

Schema ใช้ `overview`, `sections[{title,items}]`, `points` และ `concepts`; `references` ยังเป็นข้อมูลภายในและ `questions` ต้องว่างในการสร้างสรุป

## 3. Flow ใหม่

PDF → PDF.js อ่านทุกหน้า → ข้อความพร้อม metadata ภายใน → วิเคราะห์ → ตรวจเนื้อหา → บันทึกสรุป → อ่านทบทวน → กด “สร้างแบบทดสอบ” → ใช้สรุปและต้นฉบับสร้างคำถาม → ตรวจคำตอบ → บันทึกคำถามใน private schema → เริ่มทำแบบทดสอบ

TEXT → ใช้ข้อความทั้งหมด → เข้าสู่ pipeline สรุปเดียวกับ PDF

หน้า Summary แสดงเฉพาะข้อมูลบทเรียน ไม่ render references, quoted source, page, chunk หรือ verification warnings ส่วนข้อมูลตรวจสอบยังอยู่ภายใน หาก metadata ไม่ตรง สรุปที่ผ่านการตรวจเนื้อหายังเป็น `ready`; หากสร้างคำถามไม่สำเร็จ สรุปและ concepts เดิมไม่ถูกแก้

## 4. เอกสารยาว

- ใช้หน้าต่างข้อความไม่เกิน 24,000 ตัวอักษร ซ้อนทับ 600 ตัวอักษรเพื่อรักษาบริบทบริเวณขอบ
- รวบรวมสาระเป็น notes ไม่ใช่สร้าง Summary UI ราย chunk ตรวจ notes แต่ละชุดกับข้อความที่ใช้สร้าง
- รวม notes แล้วจัดกลุ่ม/ตัดประเด็นซ้ำด้วย AI; หากยังเกินขนาด ทำการย่อแบบลำดับชั้นอีกครั้ง สูงสุด 4 รอบ โดยไม่ตัด notes ทิ้ง
- สร้าง Final Summary เพียงครั้งเดียวจากข้อมูลที่รวมแล้ว และตรวจเนื้อหาอีกครั้ง
- เก็บต้นฉบับทั้งหมดและขอบเขต metadata เดิมไว้สำหรับ reference validation และแบบทดสอบ

ขีดจำกัดนำเข้ายังคง 100,000 ตัวอักษร / PDF 20 MB / ข้อความจริงขั้นต่ำ 200 ตัวอักษร ไม่รองรับ OCR ทั้งหน้าที่เป็นภาพ กระบวนการเอกสารยาวเรียก AI หลายครั้งและต้องยืนยันเวลาประมวลผลกับขีดจำกัด Edge Runtime ในระบบจริง การตรวจด้วย AI เป็น heuristic จึงไม่สามารถรับประกันว่าไม่มี hallucination หรือเนื้อหาตกหล่นได้

## 5. ผลทดสอบ

ผ่าน `npm test` 58 tests, `npm run typecheck:worker`, `npm run build`, `npm run lint`

`tests/learning.test.mjs` ครอบคลุม: PDF สั้น, PDF ยาวหลายหน้า, PDF หลายหัวข้อ, PDF ไทย, PDF อังกฤษ, TEXT ไทย, TEXT อังกฤษ, สูตร, ตาราง/รายการ, และประโยคข้ามขอบ chunk รวมทั้งการย่อหลายรอบ การตรวจ grounding ที่ไม่ผ่าน และป้องกัน metadata ในข้อความสรุป

**ขอบเขตการยืนยัน:** เพิ่ม `tests/pdf-text.test.mjs` ที่ส่ง PDF bytes แบบ in-memory เข้า PDF.js parser จริง ครอบคลุม PDF สั้น/ยาวหลายหน้า/หลายหัวข้อ/ไทย/อังกฤษ/สูตร/ตารางรายการ/ขอบ chunk และหน้าว่าง ใช้ `extractPdfText` ตัวเดียวกับแอป ส่วนสิบสถานการณ์ใน `learning.test.mjs` ใช้ข้อความ fixture หลัง extraction ทั้งสองชุด mock AI provider จึงตรวจโครงสร้างและเส้นทางประมวลผลได้ แต่ยังไม่ยืนยันคุณภาพคำตอบ Gemini จริง ตัวอย่าง mock เป็นค่าที่กำหนดไว้เพื่อทดสอบ pipeline ไม่ได้พิสูจน์ความครบถ้วนของหัวข้อ สูตร หรือตารางที่ AI สรุป

Backend integration ใช้ PGlite กับ migration จริง ยืนยันว่าไม่มีคำถามถูกสร้างเมื่อเผยแพร่สรุป ข้อผิดพลาด metadata ไม่ทำให้สรุปหาย quiz failure ไม่ทำให้สรุปล้มเหลว claim เก่าเผยแพร่ไม่ได้ ผู้ใช้ข้ามบัญชีเข้าถึงไม่ได้ และ authenticated เรียก RPC ของ worker โดยตรงไม่ได้

## 6. ตัวอย่าง Summary จาก test fixture (mock AI)

### ภาพรวมบทเรียน
บทเรียนอธิบายโปรโตคอลและการส่งข้อมูลในเครือข่าย

### หัวข้อสำคัญ
- โปรโตคอลกำหนดรูปแบบและลำดับข้อความ

### คำศัพท์/คำสำคัญ
- TCP → โปรโตคอลที่ส่งข้อมูลอย่างเชื่อถือได้

### สิ่งที่ควรจำ
- TCP ส่งข้อมูลอย่างเชื่อถือได้

## 7. การนำขึ้นใช้งาน

ยังไม่ได้เปลี่ยนฐานข้อมูลหรือ deploy ระบบออนไลน์ในงานนี้ ต้อง apply migration `202610020007_learning_summary.sql` หลัง migration 006 ก่อน deploy worker `analyze-content` และ frontend รุ่นนี้ จากนั้นทดสอบไฟล์ PDF จริงและ Gemini จริงทั้งสิบกรณี รวมถึงเวลาประมวลผลเอกสารยาวและการแสดงผลใน browser
