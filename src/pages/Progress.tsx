function Progress() {
    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    My Progress 📊
                </h2>

                <p className="mt-2 text-slate-500">
                    Track your learning progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Overall Progress
                    </p>

                    <p className="text-4xl font-bold mt-2 text-blue-600">
                        0%
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Quizzes Completed
                    </p>

                    <p className="text-4xl font-bold mt-2">
                        0
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Study Streak
                    </p>

                    <p className="text-4xl font-bold mt-2">
                        0 🔥
                    </p>
                </div>
            </div>
        </main>
    )
}

export default Progress