import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
            <div className="w-full max-w-sm space-y-6 px-4">
                {/* Logo / Brand placeholder */}
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-px flex-1" />
                    <Skeleton className="h-4 w-8 rounded" />
                    <Skeleton className="h-px flex-1" />
                </div>

                <Skeleton className="h-10 w-full rounded-lg" />

                <Skeleton className="mx-auto h-4 w-40 rounded-md" />
            </div>
        </div>
    )
}
