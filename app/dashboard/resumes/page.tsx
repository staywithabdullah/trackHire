import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResumeManager from '@/components/resume-manager'

export const dynamic = 'force-dynamic'

export default async function ResumesPage() {
    const supabase = await createClient()

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch resumes
    const { data: resumes } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false })

    // Fetch jobs (for resume-job linkage)
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_title, company_name, location, status, priority, date_applied, resume_id')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Resumes
                </h1>
                <p className="text-zinc-500 text-sm">
                    Manage your resumes and see which job applications use each one
                </p>
            </div>

            <ResumeManager
                initialResumes={resumes || []}
                jobs={jobs || []}
                user={user}
            />
        </div>
    )
}
