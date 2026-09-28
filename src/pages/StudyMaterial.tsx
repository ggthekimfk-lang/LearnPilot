import { useRef, useState } from 'react'

interface StudyMaterialProps {
    onSubmit: (text: string) => void
}

function StudyMaterial({ onSubmit }: StudyMaterialProps) {
    const [text, setText] = useState('')
    const [fileName, setFileName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]

        if (!file) return

        setError('')
        setSubmitted(false)

        if (file.type !== 'application/pdf') {
            setError('กรุณาเลือกไฟล์ PDF เท่านั้น')
            return
        }

        setSelectedFile(file)
        setFileName(file.name)

        // ถ้าเลือก PDF ให้ล้าง Text
        setText('')
    }
    const handleContinue = () => {
        if (!text.trim() && !selectedFile) {
            setError('กรุณาใส่ข้อความหรือเลือกไฟล์ PDF ก่อน')
            return
        }

        setError('')

        const studyMaterial = {
            type: selectedFile ? 'pdf' : 'text',
            text: text.trim(),
            fileName: selectedFile?.name ?? '',
            fileSize: selectedFile?.size ?? 0,
        }

        console.log('Study Material:', studyMaterial)

        // ส่งข้อความไป App.tsx
        if (text.trim()) {
            onSubmit(text.trim())
            return
        }

        setSubmitted(true)
    }
    const handleRemoveFile = () => {
        setSelectedFile(null)
        setFileName('')
        setSubmitted(false)

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6 md:p-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <div className="mb-8">
                    <p className="mb-2 text-sm font-medium text-blue-600">
                        LearnPilot AI
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900">
                        Add Study Material
                    </h1>

                    <p className="mt-2 text-slate-500">
                        เพิ่มเนื้อหาที่ต้องการเรียน แล้วให้ LearnPilot
                        ช่วยสร้างบทเรียน
                    </p>
                </div>

                {/* Main Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">

                    {/* Text */}
                    <div>
                        <label
                            htmlFor="study-material"
                            className="mb-3 block text-lg font-semibold text-slate-900"
                        >
                            📝 Study Text
                        </label>

                        <textarea
                            id="study-material"
                            value={text}
                            disabled={!!selectedFile}
                            onChange={(event) => {
                                setText(event.target.value)
                                setError('')
                                setSubmitted(false)
                            }}
                            placeholder="วางข้อความจากหนังสือ เอกสาร หรือเนื้อหาที่ต้องการเรียนที่นี่..."
                            className="min-h-[280px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <div className="mt-2 flex justify-end text-sm text-slate-400">
                            {text.length.toLocaleString()} characters
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200" />

                        <span className="text-sm font-medium text-slate-400">
                            OR
                        </span>

                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* PDF */}
                    <div>
                        <p className="mb-3 text-lg font-semibold text-slate-900">
                            📄 Upload PDF
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50"
                        >
                            <div className="text-4xl">
                                📄
                            </div>

                            <div className="mt-3 font-semibold text-slate-700">
                                Click to upload PDF
                            </div>

                            <div className="mt-1 text-sm text-slate-400">
                                รองรับไฟล์ PDF
                            </div>
                        </button>

                        {/* Selected PDF */}
                        {fileName && (
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50 p-4">

                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        📄
                                    </span>

                                    <div>
                                        <p className="font-medium text-slate-800">
                                            {fileName}
                                        </p>

                                        <p className="text-sm text-blue-600">
                                            PDF selected
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="text-sm font-medium text-red-500 hover:text-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success */}
                    {submitted && (
                        <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                            ✅ รับ Study Material เรียบร้อยแล้ว
                            <br />
                            ขั้นต่อไปเราจะนำข้อมูลนี้ไปสร้างบทเรียน
                        </div>
                    )}

                    {/* Continue */}
                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={handleContinue}
                            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                        >
                            Continue →
                        </button>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                    <h2 className="font-semibold text-slate-800">
                        💡 What happens next?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        LearnPilot จะนำเนื้อหาที่คุณส่งเข้ามาไปเตรียมสำหรับ
                        Summary และ Quiz
                    </p>
                </div>

            </div>
        </div>
    )
}

export default StudyMaterial