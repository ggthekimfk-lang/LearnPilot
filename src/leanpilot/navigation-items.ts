export type NavigationPage = 'today' | 'library' | 'plan' | 'progress' | 'settings' | 'account' | 'tutor' | 'search'
export const navigationLabels: Record<NavigationPage, string> = { today: 'หน้าหลัก', library: 'วิชาและเนื้อหา', plan: 'แผนการเรียน', progress: 'ผลการเรียนรู้', settings: 'ตั้งค่า', account: 'บัญชีของฉัน', tutor: 'ผู้ช่วย AI', search: 'ค้นหา' }
export const navigationGroups: { label: string; pages: NavigationPage[] }[] = [
  { label: 'เรียนรู้', pages: ['today', 'library', 'tutor', 'search'] },
  { label: 'วางแผนและเติบโต', pages: ['plan', 'progress'] },
  { label: 'ส่วนตัว', pages: ['account', 'settings'] },
]
