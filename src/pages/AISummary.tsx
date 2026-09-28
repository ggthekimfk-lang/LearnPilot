import { useState } from 'react'
import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'

interface AISummaryProps {
  onNavigate: (page: Page) => void
}

function AISummary({ onNavigate }: AISummaryProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'points'>('summary')

  const tabs = [
    { key: 'summary' as const, label: 'Summary' },
    { key: 'concepts' as const, label: 'Key Concepts' },
    { key: 'points' as const, label: 'Important Points' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <PageHeader title="AI Summary" onBack={() => onNavigate('home')} />

      {/* Subject Header */}
      <div className="bg-white px-5 pb-4">
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Computer Networks</h2>
            <p className="text-xs text-gray-500">5 pages · 12 min read</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-4 pb-8 page-transition">
        {/* Mascot Bubble */}
        <div className="flex items-start gap-3 mb-5">
          <img src="/mascot.jpg" alt="AI" className="w-9 h-9 rounded-full flex-shrink-0" />
          <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm flex-1">
            <p className="text-sm text-gray-600">Here's your summary!</p>
          </div>
        </div>

        {activeTab === 'summary' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              Key Takeaways
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                The OSI model has 7 layers.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Each layer has specific functions and protocols.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                TCP provides reliable data transfer.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                UDP is faster but less reliable.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                IP handles addressing and routing.
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="space-y-3 animate-fadeIn">
            {['OSI Model', 'TCP/IP Protocol', 'Subnetting', 'DNS', 'HTTP/HTTPS'].map((concept) => (
              <div key={concept} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">🔑</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{concept}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'points' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn">
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                'Layer 3 handles logical addressing',
                'Routers operate at the Network layer',
                'IP addresses can be IPv4 or IPv6',
                'Subnetting divides networks into smaller segments',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-bold text-primary bg-primary-light w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Button */}
        <button
          id="btn-summary-next"
          onClick={() => onNavigate('quiz')}
          className="w-full mt-6 py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-primary-dark active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 6px 20px rgba(11, 155, 107, 0.25)' }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default AISummary
