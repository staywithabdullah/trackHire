'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
    Briefcase,
    LayoutDashboard,
    ListTodo,
    BarChart2,
    User,
    Settings,
    LogOut
} from 'lucide-react'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Tracker', href: '/dashboard/jobs', icon: ListTodo },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
            {/* Sidebar Header */}
            <div className="flex h-16 items-center gap-2.5 px-6 border-b border-zinc-100/80 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black">
                    <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
                    TrackHire
                </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1.5 px-4 py-6">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
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
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Sign Out</span>
                </Link>
            </div>
        </aside>
    )
}
