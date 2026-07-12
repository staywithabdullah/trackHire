'use client'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Search, Bell, Sun, Moon } from 'lucide-react'

type DashboardHeaderProps = {
    user: {
        email?: string
        fullName?: string
        avatarUrl?: string
    }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
    const { theme, toggleTheme } = useTheme()

    const displayName = user.fullName || user.email?.split('@')[0] || 'User'
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <header className="fixed top-0 right-0 z-10 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-zinc-200 bg-white/80 px-8 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
            {/* Search Bar */}
            <div className="relative w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                    type="search"
                    placeholder="Search jobs, companies, locations..."
                    className="pl-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="relative text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                </Button>

                {/* Theme Switcher */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleTheme}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>

                <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                {/* User Profile */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
                        {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={displayName} />
                        ) : null}
                        <AvatarFallback className="bg-zinc-100 text-xs font-semibold text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {displayName}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {user.email}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}
