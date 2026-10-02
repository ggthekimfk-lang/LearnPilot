import { useEffect, useState } from 'react'

import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'
import { getStudyMaterial } from '../lib/studyMaterials'

interface AISummaryProps {
  onNavigate: (page: Page) => void
  studyMaterial: string | null
  materialId: string | null
}

function AISummary({
  onNavigate,
  studyMaterial,
  materialId,
}: AISummaryProps) {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'concepts' | 'points'
  >('summary')

  const [materialResult, setMaterialResult] = useState<{
    id: string
    content: string | null
    error: string
  } | null>(null)

  const tabs = [
    { key: 'summary' as const, label: 'Summary' },
    { key: 'concepts' as const, label: 'Key Concepts' },
    { key: 'points' as const, label: 'Important Points' },
  ]

  useEffect(() => {
    if (!materialId) return

    let cancelled = false

    const loadMaterial = async () => {
      try {
        const material = await getStudyMaterial(materialId)
        if (!cancelled) {
          setMaterialResult({ id: materialId, content: material.content, error: '' })
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Load Study Material failed:', error)
          setMaterialResult({
            id: materialId,
            content: null,
            error: 'ไม่สามารถโหลด Study Material จาก Supabase ได้',
          })
        }
      }
    }

    loadMaterial()
    return () => {
      cancelled = true
    }
  }, [materialId])

  const matchingResult = materialResult?.id === materialId ? materialResult : null
  const databaseMaterial = matchingResult?.content ?? null
  const loading = Boolean(materialId) && matchingResult === null
  const error = matchingResult?.error ?? ''
  const currentMaterial = databaseMaterial ?? studyMaterial

  const hasMaterial =
    currentMaterial !== null && currentMaterial.trim().length > 0

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <PageHeader
        title="AI Summary"
        onBack={() => onNavigate('home')}
      />

      {!materialId ? (
        <div className="px-5 pt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-5xl mb-4">📚</div>

            <h2 className="text-lg font-bold text-gray-800">
              ยังไม่มี Study Material
            </h2>

            <p className="text-sm text-gray-500 mt-2 leading-6">
              กรุณาเพิ่มข้อความหรือไฟล์ PDF
              ก่อนให้ LearnPilot สร้าง Summary
            </p>

            <button
              onClick={() => onNavigate('home')}
              className="mt-5 w-full py-3 bg-primary text-white font-bold text-sm rounded-xl"
            >
              เพิ่ม Study Material
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="px-5 pt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-4xl mb-4">⏳</div>

            <h2 className="text-lg font-bold text-gray-800">
              กำลังโหลด Study Material
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              กำลังอ่านข้อมูลจาก Supabase...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="px-5 pt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-4 text-center">⚠️</div>

            <h2 className="text-lg font-bold text-gray-800 text-center">
              โหลดข้อมูลไม่สำเร็จ
            </h2>

            <p className="text-sm text-red-500 mt-3 text-center">
              {error}
            </p>
          </div>
        </div>
      ) : !hasMaterial ? (
        <div className="px-5 pt-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-5xl mb-4">📚</div>

            <h2 className="text-lg font-bold text-gray-800">
              ยังไม่มี Study Material
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              ยังไม่พบเนื้อหาสำหรับ Material นี้
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Material information */}
          <div className="bg-white px-5 pb-4">
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
                📄
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-800">
                  Study Material
                </h2>

                <p className="text-xs text-gray-500">
                  {currentMaterial.length.toLocaleString()} characters
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    activeTab === tab.key
                      ? 'px-4 py-2 rounded-full text-xs font-semibold transition-all bg-primary text-white shadow-sm'
                      : 'px-4 py-2 rounded-full text-xs font-semibold transition-all bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-5 mt-4 pb-8">
            <div className="flex items-start gap-3 mb-5">
              <img
                src="/mascot.jpg"
                alt="AI"
                className="w-9 h-9 rounded-full flex-shrink-0"
              />

              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm flex-1">
                <p className="text-sm text-gray-600">
                  รับ Study Material จาก Supabase แล้ว
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  ตอนนี้เราพร้อมนำเนื้อหานี้ไปสร้าง AI Summary
                </p>
              </div>
            </div>

            {activeTab === 'summary' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Summary
                </h3>

                <p className="text-sm text-gray-500 leading-6">
                  ยังไม่มี AI Summary
                </p>

                <p className="text-xs text-gray-400 mt-3">
                  ขั้นตอนถัดไปเราจะเชื่อม Gemini เพื่อสร้าง Summary
                  จาก Study Material
                </p>
              </div>
            )}

            {activeTab === 'concepts' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Key Concepts
                </h3>

                <p className="text-sm text-gray-500">
                  ยังไม่มี Key Concepts
                </p>
              </div>
            )}

            {activeTab === 'points' && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Important Points
                </h3>

                <p className="text-sm text-gray-500">
                  ยังไม่มี Important Points
                </p>
              </div>
            )}

            {/* Material loaded from Supabase */}
            <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                Your Study Material
              </h3>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 leading-6 whitespace-pre-wrap">
                  {currentMaterial}
                </p>
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-gray-400">
              Material ID: {materialId}
            </div>

            <button
              id="btn-summary-next"
              onClick={() => onNavigate('quiz')}
              className="w-full mt-6 py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-lg active:scale-[0.98] transition-all"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AISummary
