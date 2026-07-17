'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000
const STORAGE_KEY = 'trackhire_last_active'
// How often to update the "last active" stamp while the tab is open
const HEARTBEAT_INTERVAL_MS = 30 * 1000

export default function SessionMonitor() {
    const router = useRouter()
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        const supabase = createClient()

        // ── Check on mount: has the session expired while the tab was closed? ──
        const lastActive = localStorage.getItem(STORAGE_KEY)
        if (lastActive) {
            const elapsed = Date.now() - Number(lastActive)
            if (elapsed > SESSION_TIMEOUT_MS) {
                // Session expired → sign out and redirect
                supabase.auth.signOut().then(() => {
                    localStorage.removeItem(STORAGE_KEY)
                    window.location.href = '/auth/login'
                })
                return // stop further setup
            }
        }

        // ── Stamp "now" and keep heartbeat while the tab is active ──
        const stamp = () => localStorage.setItem(STORAGE_KEY, String(Date.now()))

        stamp() // initial stamp
        heartbeatRef.current = setInterval(stamp, HEARTBEAT_INTERVAL_MS)

        // Also stamp on user interaction so the timer stays fresh
        const onActivity = () => stamp()
        window.addEventListener('focus', onActivity)
        window.addEventListener('click', onActivity)
        window.addEventListener('keydown', onActivity)

        // When the tab is about to close / navigate away, stamp one last time
        const onBeforeUnload = () => stamp()
        window.addEventListener('beforeunload', onBeforeUnload)

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            window.removeEventListener('focus', onActivity)
            window.removeEventListener('click', onActivity)
            window.removeEventListener('keydown', onActivity)
            window.removeEventListener('beforeunload', onBeforeUnload)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
}
