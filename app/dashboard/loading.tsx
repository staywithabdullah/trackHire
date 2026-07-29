import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-52 rounded-lg" />
                <Skeleton className="h-4 w-80 rounded-md" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-8 w-12 rounded-md" />
                    </div>
                ))}
            </div>

            {/* Toolbar row */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-64 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="ml-auto h-9 w-28 rounded-lg" />
            </div>

            {/* Table skeleton */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    {[80, 120, 100, 80, 60].map((w, i) => (
                        <Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
                    ))}
                </div>

                {/* Data rows */}
                {Array.from({ length: 6 }).map((_, row) => (
                    <div
                        key={row}
                        className="flex items-center gap-4 px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                    >
                        {[80, 120, 100, 80, 60].map((w, col) => (
                            <Skeleton key={col} className="h-4 rounded-md" style={{ width: w }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
