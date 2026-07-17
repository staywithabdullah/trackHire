'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/sidebar-context'
import {
    LayoutDashboard,
    ListTodo,
    FileText,
    User,
    Settings,
    LogOut,
    X
} from 'lucide-react'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Tracker', href: '/dashboard/jobs', icon: ListTodo },
    { name: 'Resumes', href: '/dashboard/resumes', icon: FileText },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
    const pathname = usePathname()
    const { isOpen, close } = useSidebar()

    const sidebarContent = (
        <aside className="flex h-full w-64 flex-col border-r border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
            {/* Sidebar Header */}
            <div className="flex h-16 items-center gap-2.5 px-6 border-b border-zinc-100/80 dark:border-zinc-800/80 mt-2">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-transparent">
                    <Image src="/logo.png" alt="TrackHire Logo" width={36} height={36} className="object-cover" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
                    TrackHire
                </span>
                {/* Close button — mobile only */}
                <button
                    onClick={close}
                    className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    aria-label="Close sidebar"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1.5 px-4 py-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={close}
                            className={cn(
                                "group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                isActive
                                    ? "text-zinc-950 dark:text-white bg-zinc-100/80 dark:bg-zinc-900"
                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn(
                                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                                    isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
                                )} />
                                <span>{item.name}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-zinc-100/80 dark:border-zinc-800/80">
                <Link
                    href="/auth/logout"
                    onClick={close}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                </Link>
            </div>
        </aside>
    )

    return (
        <>
            {/* Desktop: permanent fixed sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex">
                {sidebarContent}
            </div>

            {/* Mobile: overlay drawer */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                        onClick={close}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 z-40 lg:hidden">
                        {sidebarContent}
                    </div>
                </>
            )}
        </>
    )
}
