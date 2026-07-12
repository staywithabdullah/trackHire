import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/analytics-dashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, status, priority, employment_type, date_applied, created_at')
        .order('date_applied', { ascending: true })

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Analytics
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Visual breakdown of your application patterns and pipeline health
                </p>
            </div>

            <AnalyticsDashboard jobs={jobs || []} />
        </div>
    )
}
