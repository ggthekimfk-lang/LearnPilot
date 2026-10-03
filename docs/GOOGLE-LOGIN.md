# เข้าสู่ระบบด้วย Google

หน้าเข้าสู่ระบบและสมัครสมาชิกมีปุ่ม Google ซึ่งใช้ Supabase Auth OAuth ผู้ใช้เลือกบัญชี Google แล้วกลับมายัง origin ที่เปิดแอปอยู่ ระบบใช้ session และการแยกข้อมูลเจ้าของบัญชีเดิม ไม่ขอสิทธิ์อ่าน Gmail หรือ Drive

## ตั้งค่าโปรเจกต์ปัจจุบัน

ตรวจเมื่อ 3 ตุลาคม 2026: Supabase เปิด Email provider แล้ว แต่ Google provider ยังปิดอยู่ ปุ่มจะใช้งานจริงได้หลังตั้งค่าต่อไปนี้

1. ใน Google Cloud Console → Google Auth Platform ตั้งค่า Branding และ Audience ให้เรียบร้อย หากยังเป็น Testing ให้เพิ่มบัญชีทดสอบใน Test users
2. สร้าง OAuth client ชนิด Web application ใน Clients และเพิ่ม Authorized redirect URI:

   `https://rmodpumcfenpaotvyttb.supabase.co/auth/v1/callback`

3. ใน Supabase → Authentication → Sign In / Providers → Google เปิด provider และใส่ Client ID กับ Client Secret จาก Google แล้วบันทึก เก็บ Secret ฝั่ง Supabase เท่านั้น ห้ามใส่ใน `.env` ของ frontend หรือ `VITE_*`
4. ใน Supabase → Authentication → URL Configuration ตั้ง Site URL เป็น URL production และเพิ่ม Redirect URLs ที่ใช้งานจริง:

   - `http://localhost:5173/`
   - `https://learn-pilot-blush.vercel.app/`

   หาก Vite ใช้ port อื่น ให้เพิ่ม URL นั้นด้วย ค่า APP_ORIGIN ของ Edge Function ไม่เกี่ยวกับรายการ redirect ของ Auth
5. เปิดแอปในหน้าต่างส่วนตัว กดเข้าสู่ระบบด้วย Google เลือกบัญชี และตรวจว่ากลับเข้าหน้าหลักได้ จากนั้นออกจากระบบและเข้าด้วยบัญชีเดิมอีกครั้งเพื่อตรวจว่าข้อมูลยังอยู่

การกดปุ่ม Google ไม่ต้องกรอกช่องอีเมลหรือรหัสผ่านในแอป การตรวจสิทธิ์และแลก token ทำโดย Google และ Supabase ใช้ชื่อและอีเมลของบัญชีตามปกติของการเข้าสู่ระบบ

เอกสารอ้างอิง: [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
