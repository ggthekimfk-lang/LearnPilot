function Courses() {
    const courses = [
        {
            title: 'Mathematics',
            description: 'Learn mathematics from the basics.',
            progress: 75,
            icon: '📐',
        },
        {
            title: 'English',
            description: 'Improve your English skills.',
            progress: 60,
            icon: '📖',
        },
        {
            title: 'Science',
            description: 'Explore science and the world around us.',
            progress: 40,
            icon: '🔬',
        },
    ]

    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    My Courses 📚
                </h2>

                <p className="mt-2 text-slate-500">
                    Continue learning from your courses.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.title}
                        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                        <div className="text-4xl mb-4">
                            {course.icon}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900">
                            {course.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            {course.description}
                        </p>

                        <div className="mt-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">
                                    Progress
                                </span>

                                <span className="text-sm font-medium text-blue-600">
                                    {course.progress}%
                                </span>
                            </div>

                            <div className="w-full h-3 bg-slate-100 rounded-full">
                                <div
                                    className="h-3 bg-blue-600 rounded-full"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                        </div>

                        <button className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
                            Continue Learning
                        </button>
                    </div>
                ))}
            </div>
        </main>
    )
}

export default Courses