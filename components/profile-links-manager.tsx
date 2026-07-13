'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    Link2,
    Plus,
    Pencil,
    Trash2,
    Copy,
    ExternalLink,
    Loader2,
    Check,
    Globe,
    Code2,
    ImageIcon,
    Video,
    AtSign,
    Briefcase,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileLink {
    id: string
    name: string
    url: string
    created_at: string
}

interface ProfileLinksManagerProps {
    initialLinks: ProfileLink[]
    userId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a Lucide icon component based on the link name keyword.
 */
function getLinkIcon(name: string) {
    const lower = name.toLowerCase()
    if (lower.includes('linkedin') || lower.includes('job') || lower.includes('work')) return <Briefcase className="h-4 w-4" />
    if (lower.includes('github') || lower.includes('gitlab') || lower.includes('code') || lower.includes('portfolio')) return <Code2 className="h-4 w-4" />
    if (lower.includes('instagram') || lower.includes('photo')) return <ImageIcon className="h-4 w-4" />
    if (lower.includes('youtube') || lower.includes('video') || lower.includes('vimeo')) return <Video className="h-4 w-4" />
    if (lower.includes('twitter') || lower.includes('x.com') || lower.includes('facebook') || lower.includes('social')) return <AtSign className="h-4 w-4" />
    return <Globe className="h-4 w-4" />
}

/**
 * Returns a color class set based on the link name keyword.
 */
function getLinkColor(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('linkedin')) return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
    if (lower.includes('github')) return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
    if (lower.includes('instagram')) return 'bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400'
    if (lower.includes('facebook')) return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
    if (lower.includes('twitter') || lower.includes('x.com')) return 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'
    if (lower.includes('youtube')) return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
}

/**
 * Ensures that a URL has a proper protocol scheme for opening.
 */
function ensureProtocol(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`
    }
    return url
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileLinksManager({ initialLinks, userId }: ProfileLinksManagerProps) {
    const supabase = createClient()

    // ── State ────────────────────────────────────────────────────────────────

    const [links, setLinks] = useState<ProfileLink[]>(initialLinks)

    // Add
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [addName, setAddName] = useState('')
    const [addUrl, setAddUrl] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // Edit
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingLink, setEditingLink] = useState<ProfileLink | null>(null)
    const [editName, setEditName] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    // Delete
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [linkToDelete, setLinkToDelete] = useState<ProfileLink | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Copy feedback
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // ── Handlers ─────────────────────────────────────────────────────────────

    // ADD
    const handleOpenAdd = () => {
        setAddName('')
        setAddUrl('')
        setIsAddOpen(true)
    }

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!addName.trim()) { toast.error('Link name is required'); return }
        if (!addUrl.trim()) { toast.error('URL is required'); return }

        setIsAdding(true)
        try {
            const { data, error } = await supabase
                .from('profile_links')
                .insert([{ user_id: userId, name: addName.trim(), url: addUrl.trim() }])
                .select()
                .single()

            if (error) throw error

            setLinks((prev) => [data as ProfileLink, ...prev])
            toast.success('Link added successfully')
            setIsAddOpen(false)
        } catch (err: any) {
            toast.error(err.message || 'Failed to add link')
        } finally {
            setIsAdding(false)
        }
    }

    // EDIT
    const handleOpenEdit = (link: ProfileLink) => {
        setEditingLink(link)
        setEditName(link.name)
        setEditUrl(link.url)
        setIsEditOpen(true)
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLink) return
        if (!editName.trim()) { toast.error('Link name is required'); return }
        if (!editUrl.trim()) { toast.error('URL is required'); return }

        setIsSavingEdit(true)
        try {
            const { error } = await supabase
                .from('profile_links')
                .update({ name: editName.trim(), url: editUrl.trim() })
                .eq('id', editingLink.id)

            if (error) throw error

            setLinks((prev) =>
                prev.map((l) =>
                    l.id === editingLink.id
                        ? { ...l, name: editName.trim(), url: editUrl.trim() }
                        : l
                )
            )
            toast.success('Link updated successfully')
            setIsEditOpen(false)
            setEditingLink(null)
        } catch (err: any) {
            toast.error(err.message || 'Failed to update link')
        } finally {
            setIsSavingEdit(false)
        }
    }

    // DELETE
    const handleOpenDelete = (link: ProfileLink) => {
        setLinkToDelete(link)
        setIsDeleteOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!linkToDelete) return
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('profile_links')
                .delete()
                .eq('id', linkToDelete.id)

            if (error) throw error

            setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id))
            toast.success('Link deleted')
            setIsDeleteOpen(false)
            setLinkToDelete(null)
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete link')
        } finally {
            setIsDeleting(false)
        }
    }

    // COPY
    const handleCopy = async (link: ProfileLink) => {
        try {
            await navigator.clipboard.writeText(link.url)
            setCopiedId(link.id)
            toast.success('Link copied to clipboard')
            setTimeout(() => setCopiedId(null), 2000)
        } catch {
            toast.error('Failed to copy link')
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* ═══════════════════════ HEADER ═══════════════════════ */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Important Links</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Store links you frequently share when applying for jobs
                    </p>
                </div>
                <Button
                    onClick={handleOpenAdd}
                    className="h-9 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold text-xs"
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Link
                </Button>
            </div>

            {/* ═══════════════════════ LIST ═══════════════════════ */}
            {links.length === 0 ? (
                <Card className="border border-dashed border-zinc-300 dark:border-zinc-800 py-12 flex flex-col items-center justify-center text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                        <Link2 className="h-5 w-5 text-zinc-400" />
                    </div>
                    <CardTitle className="text-zinc-900 dark:text-white font-bold text-base">
                        No links added yet
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 mt-1.5 max-w-[260px]">
                        Add your LinkedIn, GitHub, portfolio, or any other link you share when applying.
                    </CardDescription>
                    <Button
                        onClick={handleOpenAdd}
                        variant="outline"
                        className="mt-4 h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Your First Link
                    </Button>
                </Card>
            ) : (
                <div className="space-y-2">
                    {links.map((link) => {
                        const isCopied = copiedId === link.id
                        const iconColor = getLinkColor(link.name)
                        return (
                            <Card
                                key={link.id}
                                className="border border-zinc-200/80 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/20 shadow-sm"
                            >
                                <div className="flex items-center justify-between px-4 py-3 gap-3">
                                    {/* Left: icon + info */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                                            {getLinkIcon(link.name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                {link.name}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                {link.url}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {/* Copy */}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleCopy(link)}
                                            title="Copy URL"
                                            className={`h-8 w-8 transition-colors ${isCopied
                                                ? 'text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            {isCopied ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>

                                        {/* Open in new tab */}
                                        <a
                                            href={ensureProtocol(link.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open link"
                                            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>

                                        {/* Edit */}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleOpenEdit(link)}
                                            title="Edit link"
                                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleOpenDelete(link)}
                                            title="Delete link"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* ═══════════════════ ADD LINK DIALOG ═══════════════════ */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Add Link
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1">
                            Add a link you frequently share when applying for jobs
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddLink} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label htmlFor="add-link-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Link Name *
                            </label>
                            <Input
                                id="add-link-name"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder="e.g. LinkedIn, GitHub, Portfolio"
                                disabled={isAdding}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="add-link-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                URL *
                            </label>
                            <Input
                                id="add-link-url"
                                value={addUrl}
                                onChange={(e) => setAddUrl(e.target.value)}
                                placeholder="e.g. https://linkedin.com/in/yourname"
                                disabled={isAdding}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddOpen(false)}
                                disabled={isAdding}
                                className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAdding}
                                className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                            >
                                {isAdding ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                                ) : (
                                    'Add Link'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ═══════════════════ EDIT LINK DIALOG ══════════════════ */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Edit Link
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1">
                            Update the name or URL of this link
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label htmlFor="edit-link-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Link Name *
                            </label>
                            <Input
                                id="edit-link-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="e.g. LinkedIn, GitHub, Portfolio"
                                disabled={isSavingEdit}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="edit-link-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                URL *
                            </label>
                            <Input
                                id="edit-link-url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="e.g. https://linkedin.com/in/yourname"
                                disabled={isSavingEdit}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSavingEdit}
                                className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSavingEdit}
                                className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                            >
                                {isSavingEdit ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ════════════════ DELETE CONFIRM DIALOG ════════════════ */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Delete Link
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1.5">
                            Are you sure you want to delete this link? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {linkToDelete && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 my-2">
                            <span className="text-xs text-zinc-500 block">Link to delete:</span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white block mt-0.5">
                                {linkToDelete.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 block mt-0.5 truncate">
                                {linkToDelete.url}
                            </span>
                        </div>
                    )}

                    <DialogFooter className="gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                            className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="h-10 font-semibold"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Link'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
