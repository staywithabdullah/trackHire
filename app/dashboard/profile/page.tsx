import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile-form'
import ProfileLinksManager from '@/components/profile-links-manager'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch important links
    const { data: links } = await supabase
        .from('profile_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Page Header */}
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Profile Settings
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Manage your personal information, profile picture, and important links
                </p>
            </div>

            {/* Personal Info Card */}
            <ProfileForm
                initialProfile={profile}
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
