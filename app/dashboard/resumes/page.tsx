import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResumeManager from '@/components/resume-manager'
import ProfileLinksManager from '@/components/profile-links-manager'

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

    // Fetch important links
    const { data: links } = await supabase
        .from('profile_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Resumes & Links
                </h1>
                <p className="text-zinc-500 text-sm">
                    Manage your resumes, important links, and see which job applications use each one
                </p>
            </div>

            <ResumeManager
                initialResumes={resumes || []}
                jobs={jobs || []}
                user={user}
            />

            {/* Divider */}
            <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />

            {/* Important Links Section */}
            <ProfileLinksManager
                initialLinks={links ?? []}
                userId={user.id}
            />
        </div>
    )
}
