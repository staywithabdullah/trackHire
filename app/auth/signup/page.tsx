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
import { Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'

const signupSchema = zod.object({
    fullName: zod.string().min(2, 'Full name must be at least 2 characters'),
    email: zod.string().email('Please enter a valid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type SignupFormValues = zod.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const supabase = createClient()

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true)
        setErrorMsg(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to sign in with Google')
            setIsGoogleLoading(false)
        }
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true)
        setErrorMsg(null)

        try {
            const emailRedirectTo = `${window.location.origin}/auth/callback`
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo,
                    data: {
                        full_name: data.fullName,
                    },
                },
            })

            if (error) {
                throw error
            }

            if (authData.user) {
                router.push('/auth/verify-email')
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred during registration. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
            {/* Left side: Hero Image (visible on lg screens only) */}
            <div className="relative hidden w-1/2 overflow-hidden bg-zinc-950 lg:block">
                <Image
                    src="/auth-hero.png"
                    alt="TrackHire Dashboard"
                    fill
                    priority
                    className="object-cover object-left opacity-90 pointer-events-none select-none"
                    draggable={false}
                />
                {/* Transparent overlay to block right-click/drag download */}
                <div
                    className="absolute inset-0 z-10"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                />
            </div>

            {/* Right side: Form context */}
            <div className="flex w-full flex-col items-center justify-start overflow-y-auto px-4 py-12 lg:w-1/2 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto w-full max-w-md"
                >
                    {/* Brand Header */}
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
                                Create an account
                            </CardTitle>
                            <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                Get started tracking your applications today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {errorMsg && (
                                <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Google OAuth Button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading || isGoogleLoading}
                                className="w-full h-10 border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 font-medium flex items-center justify-center gap-2.5 transition-colors mb-4"
                            >
                                {isGoogleLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                Continue with Google
                            </Button>

                            {/* Divider */}
                            <div className="relative mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-white/70 dark:bg-zinc-900/60 px-3 text-zinc-500 dark:text-zinc-400">
                                        or continue with email
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                        <Input
                                            {...register('fullName')}
                                            type="text"
                                            placeholder="John Doe"
                                            disabled={isLoading}
                                            className="pl-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus:bg-zinc-950"
                                        />
                                    </div>
                                    {errors.fullName && (
                                        <p className="text-xs text-red-500">{errors.fullName.message}</p>
                                    )}
                                </div>

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

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Password
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
                                        Confirm Password
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
                                            className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                                    disabled={isLoading || isGoogleLoading}
                                    className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Sign Up'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t border-zinc-100/80 pt-5 dark:border-zinc-800/80">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Already have an account?{' '}
                                <Link
                                    href="/auth/login"
                                    className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                                >
                                    Sign in
                                </Link>
                            </span>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
