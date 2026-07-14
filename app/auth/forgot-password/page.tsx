'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

const forgotSchema = zod.object({
    email: zod.string().email('Please enter a valid email address'),
})

type ForgotFormValues = zod.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'err'>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotFormValues>({
        resolver: zodResolver(forgotSchema),
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (data: ForgotFormValues) => {
        setIsLoading(true)
        setErrorMsg(null)
        setStatus('idle')

        try {
            const emailRedirectTo = `${window.location.origin}/auth/reset-password`
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: emailRedirectTo,
            })

            if (error) {
                throw error
            }
            setStatus('success')
        } catch (err: any) {
            setErrorMsg(err.message || 'Could not send recovery link.')
            setStatus('err')
        } finally {
            setIsLoading(false)
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
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Forgot password
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your email address and we'll send you a password recovery link
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorMsg && (
                            <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {status === 'success' ? (
                            <div className="space-y-4 py-2">
                                <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <span>Recovery link sent! Please check your inbox.</span>
                                </div>
                                <Link href="/auth/login" className="w-full block">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50"
                                    >
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            {...register('email')}
                                            type="email"
                                            placeholder="name@example.com"
                                            disabled={isLoading}
                                            className="pl-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-950"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-xs text-red-500">{errors.email.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending link...
                                        </>
                                    ) : (
                                        'Send recovery link'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-zinc-100/80 pt-5 dark:border-zinc-800/80">
                        <Link
                            href="/auth/login"
                            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
