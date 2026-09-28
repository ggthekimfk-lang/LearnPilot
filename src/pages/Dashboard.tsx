function Dashboard() {
    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    Good morning 👋
                </h2>

                <p className="mt-2 text-slate-500">
                    Ready to continue your learning journey?
                </p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Courses
                    </p>

                    <h3 className="text-3xl font-bold mt-2">
                        4
                    </h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Quiz Score
                    </p>

                    <h3 className="text-3xl font-bold mt-2">
                        82%
                    </h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500">
                        Study Streak
                    </p>

                    <h3 className="text-3xl font-bold mt-2">
                        7 days 🔥
                    </h3>
                </div>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">
                    Continue Learning
                </h3>

                <div className="mt-5">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-600">
                            Mathematics
                        </span>

                        <span className="text-sm font-medium text-blue-600">
                            75%
                        </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full">
                        <div className="w-3/4 h-3 bg-blue-600 rounded-full" />
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Dashboard