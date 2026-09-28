import { useState } from 'react'
import type { Page } from '../components/layout/BottomNav'

interface LoginPageProps {
  onNavigate: (page: Page) => void
}

function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = () => {
    if (!validate()) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      onNavigate('home')
    }, 1200)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white page-transition">
      {/* Top Gradient Section */}
      <div
        className="relative px-6 pt-12 pb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #0B9B6B 0%, #10B981 50%, #34D399 100%)',
          borderRadius: '0 0 32px 32px',
        }}
      >
        {/* Back Button */}
        <button
          id="btn-login-back"
          onClick={() => onNavigate('welcome')}
          className="absolute top-5 left-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Mascot */}
        <div className="animate-scaleIn mb-3">
          <img
            src="/mascot.jpg"
            alt="LearnPilot"
            className="w-20 h-20 rounded-full mx-auto border-3 border-white/30 shadow-lg"
          />
        </div>
        <h1 className="text-2xl font-black text-white animate-fadeIn">Welcome Back!</h1>
        <p className="text-sm text-white/80 mt-1 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          Log in to continue your learning journey
        </p>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
        <div className="space-y-5 animate-slideUp" style={{ animationDelay: '0.15s' }}>
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
                placeholder="example@email.com"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-danger mt-1.5 ml-1 animate-fadeIn">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
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
            {errors.password && (
              <p className="text-xs text-danger mt-1.5 ml-1 animate-fadeIn">{errors.password}</p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer" htmlFor="remember-me">
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  rememberMe ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
                onClick={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <input id="remember-me" type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
              <span className="text-xs text-gray-500">จดจำฉัน</span>
            </label>
            <button className="text-xs font-semibold text-primary hover:underline">
              ลืมรหัสผ่าน?
            </button>
          </div>
        </div>

        {/* Login Button */}
        <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.25s' }}>
          <button
            id="btn-do-login"
            onClick={handleLogin}
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
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400">หรือเข้าสู่ระบบด้วย</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Social Login */}
        <div className="flex gap-3">
          <button
            id="btn-login-google"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Google</span>
          </button>

          <button
            id="btn-login-apple"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Apple</span>
          </button>
        </div>

        {/* Register Link */}
        <div className="mt-auto pt-6 text-center">
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{' '}
            <button
              id="btn-goto-register"
              onClick={() => onNavigate('register')}
              className="font-bold text-primary hover:underline"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
