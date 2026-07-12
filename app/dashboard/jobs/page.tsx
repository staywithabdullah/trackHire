import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobTracker from '@/components/job-tracker'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
    const supabase = await createClient()

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch jobs
    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

    // Fetch resumes
    const { data: resumes } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Job Applications
                </h1>
                <p className="text-zinc-500 text-sm">
                    Track and manage your entire job application process
                </p>
            </div>

            <JobTracker
                initialJobs={jobs || []}
                resumes={resumes || []}
                userId={user.id}
            />
        </div>
    )
}
