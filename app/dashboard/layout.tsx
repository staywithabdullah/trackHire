import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard-sidebar'
import DashboardHeader from '@/components/dashboard-header'
import { SidebarProvider } from '@/components/sidebar-context'

type DashboardLayoutProps = {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const supabase = await createClient()

    // Get user session
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch or fallback profile data
    let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Sync profile and full name from user metadata if missing/empty
    const metaFullName = user.user_metadata?.full_name || ''
    const metaAvatarUrl = user.user_metadata?.avatar_url || ''

    if (!profile) {
        const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                full_name: metaFullName,
                avatar_url: metaAvatarUrl,
            })
            .select()
            .single()
        if (newProfile) {
            profile = newProfile
        }
    } else if (metaFullName && !profile.full_name) {
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({
                full_name: metaFullName,
            })
            .eq('id', user.id)
            .select()
            .single()
        if (updatedProfile) {
            profile = updatedProfile
        }
    }

    const userData = {
        email: user.email,
        fullName: profile?.full_name || metaFullName || '',
        avatarUrl: profile?.avatar_url || metaAvatarUrl || '',
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <DashboardSidebar />
                {/* Content offset: full-width on mobile, shift right by sidebar width on lg+ */}
                <div className="lg:pl-64">
                    <DashboardHeader user={userData} />
                    <main className="pt-16 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 min-h-[calc(100vh-4rem)]">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}
