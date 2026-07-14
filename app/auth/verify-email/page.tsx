'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react'

export default function VerifyEmailPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const supabase = createClient()

    // Sign out user
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    // Check verification state
    const checkVerification = async () => {
        setIsLoading(true)
        setErrorMsg(null)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            setErrorMsg(error.message)
        } else if (user?.email_confirmed_at) {
            router.push('/dashboard')
            router.refresh()
        } else {
            setErrorMsg("Your email is still unverified. Please check your inbox or request a new link.")
        }
        setIsLoading(false)
    }

    // Resend verification email
    const handleResend = async () => {
        setResendStatus('sending')
        setErrorMsg(null)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
            setResendStatus('error')
            setErrorMsg('No active user found. Please login.')
            return
        }

        try {
            const emailRedirectTo = `${window.location.origin}/auth/callback`
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo,
                },
            })

            if (error) {
                throw error
            }
            setResendStatus('sent')
            setTimeout(() => setResendStatus('idle'), 5000)
        } catch (err: any) {
            setResendStatus('error')
            setErrorMsg(err.message || 'Could not resend verification email.')
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-6 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-transparent shadow-sm">
                        <Image src="/logo.png" alt="TrackHire Logo" width={40} height={40} className="object-cover" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        TrackHire
                    </span>
                </div>

                <Card className="border border-zinc-200/80 bg-white/70 backdrop-blur-md shadow-xl dark:border-zinc-800/85 dark:bg-zinc-900/60">
                    <CardHeader className="space-y-2 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <Mail className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Verify your email
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                            We sent a verification link to your email address. Please click the link to confirm your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errorMsg && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 text-center">
                                {errorMsg}
                            </div>
                        )}

                        {resendStatus === 'sent' && (
                            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>Verification email sent successfully!</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={checkVerification}
                                disabled={isLoading}
                                className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Checking status...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        I've verified my email
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleResend}
                                disabled={resendStatus === 'sending'}
                                className="w-full h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-950"
                            >
                                {resendStatus === 'sending' ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Resending...
                                    </>
                                ) : (
                                    'Resend verification email'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-zinc-100/80 pt-5 dark:border-zinc-800/80">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Back to login
                        </button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
