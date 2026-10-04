# การอ่าน PDF บน PC, iPhone และ Android

ระบบอ่าน **ข้อความจาก PDF** เพื่อสร้างบทเรียน ไม่ใช่ตัวแสดงหน้าต้นฉบับ PDF และยังไม่ทำ OCR สำหรับไฟล์สแกน

## การรองรับในโค้ด

- ใช้ PDF.js legacy และ worker ที่ build จาก dependency รุ่นเดียวกัน
- เก็บ export ของ worker ในรูปแบบ ES module เพื่อให้ PDF.js อ่านต่อบน main thread ได้เมื่อเบราว์เซอร์บล็อก worker
- ตั้งเป้าหมาย JavaScript ทั้งแอปและ worker เป็น Chrome/Edge 92, Firefox 90 และ Safari 15.4 นี่เป็นเป้าหมายการแปลง syntax ไม่ใช่การรับรองว่าอุปกรณ์ทุกเครื่องหรือทุก API/CSS รองรับครบ
- มี fallback สำหรับ Promise.withResolvers และ ReadableStream async iteration ในแอปและ worker
- ตรวจไฟล์จากเนื้อหา ไม่บังคับ MIME type เพราะตัวเลือกไฟล์บนมือถืออาจส่งค่าว่างหรือ application/octet-stream
- ใช้ FileReader เมื่อไม่มี File.arrayBuffer และยอมรับ PDF header ภายใน 1024 ไบต์แรก
- จัดส่ง CMaps และฟอนต์มาตรฐานจาก origin ของแอป ใช้ฟอนต์ชุดเดียวกันในการแยกข้อความทุกอุปกรณ์ พร้อมรวม assets ใน PWA precache
- คืนหน่วยความจำหลังอ่านแต่ละหน้าและทำลาย loading task เมื่อสำเร็จหรือผิดพลาด
- เลือกไฟล์เดิมซ้ำได้ และล้างข้อความเดิมก่อนอ่านไฟล์ใหม่เพื่อป้องกันการบันทึกผิดเอกสารเมื่ออ่านไม่สำเร็จ
- จำกัด 20 MB, ข้อความที่อ่านได้อย่างน้อย 200 ตัวอักษร และผลลัพธ์รวมไม่เกิน 100,000 ตัวอักษร ไฟล์มีรหัสผ่านต้องปลดรหัสก่อน

## การตรวจอัตโนมัติ

`npm test` ตรวจ parser จริงกับเอกสารไทย/อังกฤษ หลายหน้า สูตร ตาราง พร้อมจำลอง API ที่หายไปบนเบราว์เซอร์เก่า และตรวจ FileReader/ไฟล์ปลอม/ไฟล์ใหญ่/การคืนหน่วยความจำ

หลัง `npm run build` ใช้ `node scripts/check-pdf-browser.mjs` เมื่อมี Playwright ติดตั้ง หรือกำหนด `PLAYWRIGHT_MODULE` เป็น absolute path ของ Playwright `index.mjs` ใช้ `PDF_CHANNEL=msedge` หรือ `chrome` สำหรับเบราว์เซอร์ที่ติดตั้ง และ `PDF_BROWSER=webkit`/`firefox` เมื่อมี engine นั้น

สคริปต์ตรวจ production chunk และ worker จริง เอกสารสองหน้าภาษาไทย/อังกฤษ MIME type จากมือถือ FileReader การอ่านต่อหลังไฟล์เสีย การโหลด assets และ fallback เมื่อ worker ถูกบล็อก ในโปรไฟล์ Desktop, iPhone 13 และ Pixel 7 การจำลอง iPhone/Pixel บน Chromium **ไม่ใช่** Safari หรือการทดสอบอุปกรณ์จริง

## การตรวจอุปกรณ์จริงก่อนรับรอง

ใช้ไฟล์ชุดเดียวกันตรวจ PC (Chrome, Edge, Firefox), iPhone (Safari และ PWA) และ Android (Chrome, Samsung Internet และ PWA):

1. เลือก PDF จากไฟล์ในเครื่อง และจาก iCloud Drive/Google Drive หลังดาวน์โหลดไฟล์แล้ว
2. ตรวจภาษาไทย/อังกฤษ เลขหน้า และข้อความครบทุกหน้า เทียบกับต้นฉบับ
3. ลองไฟล์หลายหน้าใกล้ 20 MB บนอุปกรณ์ RAM ต่ำ ตรวจว่าหน้าเว็บไม่ปิดหรือค้าง
4. เลือกไฟล์เสีย/ไฟล์รหัสผ่าน แล้วเลือกไฟล์ที่ถูกต้องซ้ำ ตรวจว่าอ่านได้และไม่มีข้อความเดิมค้าง
5. เปิด PWA ออนไลน์จน cache พร้อม แล้วตัดเครือข่าย ตรวจว่า assets สำหรับการอ่าน PDF ยังโหลดได้ (การบันทึกและวิเคราะห์ต้องออนไลน์)
6. ทดสอบ PDF สแกนและไฟล์ข้อความเกินข้อจำกัด ต้องแสดงเหตุผลที่อ่านไม่ได้อย่างชัดเจน

บันทึกรุ่นเครื่อง OS และเวอร์ชันเบราว์เซอร์พร้อมผลจริงก่อนประกาศรองรับ ไม่สามารถรับรอง Android ทุกรุ่นหรือ iPhone ทุกเวอร์ชันจากการจำลองเพียงอย่างเดียว

อ้างอิง: [PDF.js browser support](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions), [getDocument options](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)
