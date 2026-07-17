export default function DashboardLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 rounded-full border-4 border-zinc-200 border-t-violet-500 animate-spin dark:border-zinc-800 dark:border-t-violet-400" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">Loading…</p>
            </div>
        </div>
    )
}
