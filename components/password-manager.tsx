'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Lock, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'

interface PasswordManagerProps {
    user: any
    hasPasswordIdentity: boolean
}

export default function PasswordManager({ user, hasPasswordIdentity }: PasswordManagerProps) {
    const supabase = createClient()

    // Track whether user has a password — starts from server prop, flips after first set
    const [passwordSet, setPasswordSet] = useState(hasPasswordIdentity || user?.user_metadata?.has_password === true)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [isSaving, setIsSaving] = useState(false)

    const isSetMode = !passwordSet

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!isSetMode && !currentPassword.trim()) {
            toast.error('Current password is required')
            return
        }

        setIsSaving(true)

        try {
            // For existing email users, verify current password first
            if (!isSetMode) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                })

                if (signInError) {
                    toast.error('Current password is incorrect')
                    setIsSaving(false)
                    return
                }
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
                data: { has_password: true }
            })

            if (error) throw error

            toast.success(isSetMode ? 'Password set successfully!' : 'Password changed successfully!')

            // Clear form
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            // Update local state if password was set for the first time
            if (isSetMode) {
                setPasswordSet(true)
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    {isSetMode ? (
                        <KeyRound className="h-5 w-5 text-amber-500" />
                    ) : (
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    )}
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                        {isSetMode ? 'Set Password' : 'Change Password'}
                    </CardTitle>
                </div>
                <CardDescription className="text-xs text-zinc-500">
                    {isSetMode
                        ? 'You signed in with Google. Set a password to also sign in with your email and password.'
                        : 'Update your current password to keep your account secure.'
                    }
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {/* Current Password — only for users who already have one */}
                    {!isSetMode && (
                        <div className="space-y-1.5">
                            <label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Current Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    disabled={isSaving}
                                    className="pl-10 pr-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            {isSetMode ? 'Password' : 'New Password'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                disabled={isSaving}
                                className="pl-10 pr-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                disabled={isSaving}
                                className="pl-10 pr-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="border-t border-zinc-100 dark:border-zinc-900 pt-4 flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isSetMode ? 'Setting Password...' : 'Updating Password...'}
                            </>
                        ) : (
                            isSetMode ? 'Set Password' : 'Change Password'
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
