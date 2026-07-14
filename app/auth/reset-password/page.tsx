'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'

const resetSchema = zod.object({
    password: zod.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetFormValues = zod.infer<typeof resetSchema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'err'>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const supabase = createClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: ResetFormValues) => {
        setIsLoading(true)
        setErrorMsg(null)
        setStatus('idle')

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            })

            if (error) {
                throw error
            }
            setStatus('success')
            setTimeout(() => {
                router.push('/auth/login')
            }, 3000)
        } catch (err: any) {
            setErrorMsg(err.message || 'Could not update password.')
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
                            Reset password
                        </CardTitle>
                        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your new secure password below
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
                            <div className="space-y-4 py-2 text-center">
                                <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 justify-center">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <span>Password updated! Redirecting to login...</span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                            className="pl-10 pr-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-950"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-red-500">{errors.password.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            {...register('confirmPassword')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                            className="pl-10 pr-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-950"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
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
                                            Updating password...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-zinc-100/80 pt-5 dark:border-zinc-800/80">
                        <Link
                            href="/auth/login"
                            className="text-xs font-semibold text-zinc-500 hover:underline dark:text-zinc-400"
                        >
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    )
}
