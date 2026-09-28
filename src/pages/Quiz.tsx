function Quiz() {
    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    Quiz 📝
                </h2>

                <p className="mt-2 text-slate-500">
                    Test your knowledge and improve your skills.
                </p>
            </div>

            <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                        Question 1 of 5
                    </span>

                    <span className="text-sm font-medium text-blue-600">
                        Mathematics
                    </span>
                </div>

                <h3 className="text-xl font-bold mt-6">
                    What is 12 × 8?
                </h3>

                <div className="grid gap-3 mt-6">
                    <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-blue-50">
                        A. 86
                    </button>

                    <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-blue-50">
                        B. 96
                    </button>

                    <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-blue-50">
                        C. 108
                    </button>

                    <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:bg-blue-50">
                        D. 112
                    </button>
                </div>

                <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                    Next Question
                </button>
            </div>
        </main>
    )
}

export default Quiz