import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsPanel from '@/components/settings-panel'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
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

    // Fetch jobs for export
    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Settings & Resumes
                </h1>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm">
                    Manage your uploaded resumes, backup databases, or export job tracking analytics
                </p>
            </div>

            <SettingsPanel
                initialResumes={resumes || []}
                jobs={jobs || []}
                user={user}
            />
        </div>
    )
}
