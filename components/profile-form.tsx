'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User as UserIcon, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string
}

interface ProfileFormProps {
    initialProfile: Profile | null
    user: any
}

export default function ProfileForm({ initialProfile, user }: ProfileFormProps) {
    const router = useRouter()
    const supabase = createClient()

    const [fullName, setFullName] = useState(initialProfile?.full_name || '')
    const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '')

    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Initialize display initials
    const displayName = fullName || user.email?.split('@')[0] || 'User'
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    // PHOTO UPLOADER
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            // Validation
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a valid image file (PNG, JPEG, WebP)')
                return
            }

            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size must be less than 2MB')
                return
            }

            setIsUploading(true)

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

            // Upload file to Supabase storage profile-images
            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Retrieve public URL
            const { data } = supabase.storage
                .from('profile-images')
                .getPublicUrl(filePath)

            const uploadedUrl = data.publicUrl
            setAvatarUrl(uploadedUrl)

            // Automatically update database with new URL to prevent losing progress
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ avatar_url: uploadedUrl })
                .eq('id', user.id)

            if (dbError) throw dbError

            toast.success('Profile image updated successfully')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload photo')
        } finally {
            setIsUploading(false)
        }
    }

    // PROFILE SAVE ACTION
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!fullName.trim()) {
            toast.error('Full Name is required')
            return
        }

        setIsSaving(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl || null,
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Profile updated successfully')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile settings')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Personal Information</CardTitle>
                <CardDescription className="text-xs text-zinc-500">Update your public credentials and profile photo</CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveProfile}>
                <CardContent className="space-y-6">
                    {/* Avatar Area */}
                    <div className="flex items-center gap-6 pb-2">
                        <div className="relative group">
                            <Avatar className="h-20 w-20 border-2 border-zinc-200 dark:border-zinc-850 shadow-sm">
                                {avatarUrl ? (
                                    <AvatarImage src={avatarUrl} alt={displayName} />
                                ) : null}
                                <AvatarFallback className="bg-zinc-100 text-xl font-bold dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            {/* Overlay Loader */}
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    id="avatar-input"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    disabled={isUploading || isSaving}
                                />
                                <label
                                    htmlFor="avatar-input"
                                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Photo
                                </label>
                            </div>
                            <span className="text-[10px] text-zinc-550 dark:text-zinc-500">
                                Recommended: PNG, JPEG or WebP. Max size: 2MB.
                            </span>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-200/60 dark:bg-zinc-850" />

                    {/* Text Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                disabled
                                className="h-10 border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 cursor-not-allowed text-xs"
                            />
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                Email is tied to your account authentication and cannot be edited.
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Full Name
                            </label>
                            <Input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Abdullah"
                                disabled={isSaving || isUploading}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="border-t border-zinc-100 dark:border-zinc-900 pt-4 flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSaving || isUploading}
                        className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes
                            </>
                        ) : (
                            'Save Profile'
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
