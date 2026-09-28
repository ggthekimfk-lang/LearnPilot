function Settings() {
    return (
        <main className="flex-1 p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                    Settings ⚙️
                </h2>

                <p className="mt-2 text-slate-500">
                    Manage your LearnPilot preferences.
                </p>
            </div>

            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between py-4 border-b">
                    <div>
                        <p className="font-medium">
                            Notifications
                        </p>

                        <p className="text-sm text-slate-500">
                            Receive learning reminders
                        </p>
                    </div>

                    <input type="checkbox" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="font-medium">
                            Dark Mode
                        </p>

                        <p className="text-sm text-slate-500">
                            Use dark appearance
                        </p>
                    </div>

                    <input type="checkbox" />
                </div>
            </div>
        </main>
    )
}

export default Settings