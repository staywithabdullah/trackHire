import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile-form'
import PasswordManager from '@/components/password-manager'

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

    // Determine if user has an email/password identity or has manually set a password
    const hasPasswordIdentity = (user.app_metadata?.providers?.includes('email') ?? false) || (user.user_metadata?.has_password === true)

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Page Header */}
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Profile Settings
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Manage your personal information, profile picture, and security settings
                </p>
            </div>

            {/* Personal Info Card */}
            <ProfileForm
                initialProfile={profile}
                user={user}
            />

            {/* Divider */}
            <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />

            {/* Password Management Section */}
            <PasswordManager
                user={user}
                hasPasswordIdentity={hasPasswordIdentity}
            />
        </div>
    )
}
