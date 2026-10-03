import { useRef, useState } from 'react'

import type { ChangeEvent } from 'react'
import type { Page } from '../components/layout/BottomNav'
import PageHeader from '../components/layout/PageHeader'
import { createStudyMaterial } from '../lib/studyMaterials'

interface AddMaterialProps {
  onNavigate: (page: Page) => void
  onSubmit?: (text: string, materialId: string) => void
}

function AddMaterial({ onNavigate, onSubmit }: AddMaterialProps) {
  const [showTextInput, setShowTextInput] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePasteTextClick = () => {
    setShowTextInput(true)
    setSelectedFile(null)
    setError('')
  }

  const handleTextSubmit = async () => {
    const trimmedText = text.trim()

    if (!trimmedText) {
      setError('กรุณาใส่เนื้อหาก่อนกด Continue')
      return
    }

    try {
      setSaving(true)
      setError('')

      const material = await createStudyMaterial(trimmedText)

      onSubmit?.(trimmedText, material.id)
    } catch (error) {
      console.error('Save Study Material failed:', error)
      setError('ไม่สามารถบันทึก Study Material ได้ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')

    if (file.type !== 'application/pdf') {
      setError('กรุณาเลือกไฟล์ PDF เท่านั้น')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setShowTextInput(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-white page-transition">
      <PageHeader
        title="Add Learning Material"
        onBack={() => onNavigate('home')}
      />

      {/* Description */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/brand-mark.png"
            alt="Mascot"
            className="w-12 h-12 rounded-full"
          />

          <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm p-3">
            <p className="text-sm text-gray-600">
              Upload your notes or paste the content. I'll take care of the rest!
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-5 space-y-3 stagger-children">

        {/* Hidden PDF input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload PDF */}
        <button
          id="btn-upload-pdf"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-danger-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">
              Upload PDF
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              From your device
            </p>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Selected PDF */}
        {selectedFile && (
          <div className="rounded-2xl bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {selectedFile.name}
                </p>

                <p className="text-xs text-blue-600 mt-1">
                  PDF selected
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-sm font-medium text-red-500"
              >
                Remove
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              เลือก PDF แล้ว แต่เรายังไม่บันทึกจนกว่าจะทำระบบอ่านข้อความจาก PDF
            </p>
          </div>
        )}

        {/* Paste Text */}
        <button
          id="btn-paste-text"
          type="button"
          onClick={handlePasteTextClick}
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-accent-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E88E5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">
              Paste Text
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              From notes or document
            </p>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Text Input */}
        {showTextInput && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <label
              htmlFor="study-material-text"
              className="block text-sm font-bold text-gray-800 mb-3"
            >
              Study Material
            </label>

            <textarea
              id="study-material-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError('')
              }}
              placeholder="วางหรือพิมพ์เนื้อหาที่ต้องการเรียนที่นี่..."
              className="w-full min-h-[220px] resize-y rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-2 flex justify-end text-xs text-gray-400">
              {text.length.toLocaleString()} characters
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={saving}
              className="w-full mt-4 py-3 bg-primary text-white font-bold text-sm rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        )}

        {/* Take Photo */}
        <button
          id="btn-take-photo"
          type="button"
          className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0B9B6B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-800">
              Take Photo
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              From your notes
            </p>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {error && !showTextInput && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddMaterial