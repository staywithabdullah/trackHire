import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileLinksManager from '@/components/profile-links-manager'

export const dynamic = 'force-dynamic'

export default async function ImportantLinksPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: links } = await supabase
        .from('profile_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Important Links
                </h1>
                <p className="text-zinc-500 text-sm">
                    Store links you frequently share when applying for jobs
                </p>
            </div>

            <ProfileLinksManager
                initialLinks={links ?? []}
                userId={user.id}
            />
        </div>
    )
}
