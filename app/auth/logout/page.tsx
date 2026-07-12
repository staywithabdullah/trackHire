'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const handleLogout = async () => {
            await supabase.auth.signOut()
            router.push('/auth/login')
            router.refresh()
        }
        handleLogout()
    }, [router, supabase])

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
            <div className="text-zinc-500 animate-pulse font-medium">Signing out...</div>
        </div>
    )
}
