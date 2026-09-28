function AITutor() {
    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    AI Tutor 🤖
                </h2>

                <p className="mt-2 text-slate-500">
                    Ask questions and get help with your learning.
                </p>
            </div>

            <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="bg-blue-50 rounded-xl p-5">
                    <p className="font-medium text-blue-900">
                        👋 Hi! I'm your AI Tutor.
                    </p>

                    <p className="mt-2 text-sm text-blue-700">
                        What would you like to learn today?
                    </p>
                </div>

                <div className="mt-6 flex gap-3">
                    <input
                        type="text"
                        placeholder="Ask your question..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                        Ask
                    </button>
                </div>
            </div>
        </main>
    )
}

export default AITutor