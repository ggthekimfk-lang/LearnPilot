import type { Page } from '../components/layout/BottomNav'

interface WelcomeProps {
  onNavigate: (page: Page) => void
}

function Welcome({ onNavigate }: WelcomeProps) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #E8F8F2 0%, #D1FAE5 30%, #A7F3D0 60%, #6EE7B7 100%)',
      }}
    >
      {/* Decorative clouds */}
      <div className="absolute top-16 left-6 w-20 h-8 bg-white/60 rounded-full blur-sm" />
      <div className="absolute top-24 right-10 w-16 h-6 bg-white/50 rounded-full blur-sm" />
      <div className="absolute top-40 left-16 w-12 h-5 bg-white/40 rounded-full blur-sm" />

      {/* Mascot Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12">
        <div className="animate-float mb-6">
          <img
            src="/brand-mark.png"
            alt="LearnPilot Mascot"
            className="w-48 h-48 object-contain drop-shadow-lg rounded-full"
          />
        </div>

        <h1 className="text-3xl font-black text-gray-800 text-center leading-tight animate-fadeIn">
          LearnPilot AI
        </h1>

        <p className="text-base text-gray-600 mt-2 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Your AI-Powered Learning Guide
        </p>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-10 space-y-3 animate-slideUp" style={{ animationDelay: '0.3s' }}>
        <button
          id="btn-get-started"
          onClick={() => onNavigate('register')}
          className="w-full py-4 bg-primary text-white font-bold text-base rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-200"
          style={{ boxShadow: '0 8px 24px rgba(11, 155, 107, 0.3)' }}
        >
          Get Started
        </button>

        <button
          id="btn-login"
          onClick={() => onNavigate('login')}
          className="w-full py-4 text-primary font-semibold text-base rounded-2xl hover:bg-white/50 transition-all duration-200"
        >
          Log In
        </button>
      </div>
    </div>
  )
}

export default Welcome
