import { useState } from 'react'
import type { Page } from '../components/layout/BottomNav'

interface RegisterPageProps {
  onNavigate: (page: Page) => void
}

function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const getPasswordStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 1, label: 'อ่อน', color: '#EF4444' }
    if (score <= 3) return { level: 2, label: 'ปานกลาง', color: '#F59E0B' }
    return { level: 3, label: 'แข็งแรง', color: '#22C55E' }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'กรุณากรอกชื่อ'
    if (!email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    }
    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน'
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
    }
    if (!agreed) newErrors.agreed = 'กรุณายอมรับข้อกำหนด'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = () => {
    if (!validate()) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onNavigate('home')
    }, 1500)
  }

  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen flex flex-col bg-white page-transition">
      {/* Top Gradient Section */}
      <div
        className="relative px-6 pt-12 pb-7 text-center"
        style={{
          background: 'linear-gradient(135deg, #0B9B6B 0%, #10B981 50%, #34D399 100%)',
          borderRadius: '0 0 32px 32px',
        }}
      >
        {/* Back Button */}
        <button
          id="btn-register-back"
          onClick={() => onNavigate('login')}
          className="absolute top-5 left-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="animate-scaleIn mb-2">
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-black text-white animate-fadeIn">สร้างบัญชีใหม่</h1>
        <p className="text-xs text-white/80 mt-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          เริ่มต้นการเรียนรู้อัจฉริยะกับ LearnPilot AI
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-6 pb-6 flex flex-col overflow-y-auto">
        <div className="space-y-4 animate-slideUp" style={{ animationDelay: '0.15s' }}>
          {/* Name */}
          <div>
            <label htmlFor="register-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              ชื่อผู้ใช้
            </label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors ${
              errors.name ? 'border-danger bg-danger-light/50' : 'border-gray-200 focus-within:border-primary focus-within:bg-primary-light/30'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.name ? '#EF4444' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                placeholder="ชื่อของคุณ"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            {errors.name && <p className="text-xs text-danger mt-1 ml-1 animate-fadeIn">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              อีเมล
            </label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors ${
              errors.email ? 'border-danger bg-danger-light/50' : 'border-gray-200 focus-within:border-primary focus-within:bg-primary-light/30'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.email ? '#EF4444' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })) }}
                placeholder="example@email.com"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            {errors.email && <p className="text-xs text-danger mt-1 ml-1 animate-fadeIn">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              รหัสผ่าน
            </label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors ${
              errors.password ? 'border-danger bg-danger-light/50' : 'border-gray-200 focus-within:border-primary focus-within:bg-primary-light/30'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.password ? '#EF4444' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger mt-1 ml-1 animate-fadeIn">{errors.password}</p>}

            {/* Password Strength */}
            {password && (
              <div className="mt-2 animate-fadeIn">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: strength.level >= level ? strength.color : '#E2E8F0',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[11px] mt-1 font-medium" style={{ color: strength.color }}>
                  ความปลอดภัย: {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="register-confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
              ยืนยันรหัสผ่าน
            </label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors ${
              errors.confirmPassword ? 'border-danger bg-danger-light/50' : 'border-gray-200 focus-within:border-primary focus-within:bg-primary-light/30'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={errors.confirmPassword ? '#EF4444' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                id="register-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })) }}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-danger mt-1 ml-1 animate-fadeIn">{errors.confirmPassword}</p>}

            {/* Match Indicator */}
            {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
              <p className="text-[11px] text-success mt-1 ml-1 flex items-center gap-1 animate-fadeIn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                รหัสผ่านตรงกัน
              </p>
            )}
          </div>

          {/* Terms Agreement */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer" htmlFor="agree-terms">
              <div
                className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  errors.agreed && !agreed ? 'border-danger' : agreed ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
                onClick={() => { setAgreed(!agreed); setErrors(prev => ({ ...prev, agreed: '' })) }}
              >
                {agreed && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <input id="agree-terms" type="checkbox" className="hidden" checked={agreed} onChange={() => { setAgreed(!agreed); setErrors(prev => ({ ...prev, agreed: '' })) }} />
              <span className="text-xs text-gray-500 leading-relaxed">
                ฉันยอมรับ{' '}
                <span className="text-primary font-semibold">ข้อกำหนดการใช้งาน</span>
                {' '}และ{' '}
                <span className="text-primary font-semibold">นโยบายความเป็นส่วนตัว</span>
              </span>
            </label>
            {errors.agreed && <p className="text-xs text-danger mt-1 ml-7 animate-fadeIn">{errors.agreed}</p>}
          </div>
        </div>

        {/* Register Button */}
        <div className="mt-6">
          <button
            id="btn-do-register"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-bold text-base rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ boxShadow: '0 8px 24px rgba(11, 155, 107, 0.3)' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : (
              'สมัครสมาชิก'
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-auto pt-5 text-center">
          <p className="text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{' '}
            <button
              id="btn-goto-login"
              onClick={() => onNavigate('login')}
              className="font-bold text-primary hover:underline"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
