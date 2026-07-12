'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    FileText,
    Upload,
    Trash2,
    Loader2,
    ExternalLink,
    Plus,
    Pencil,
    Check,
    X,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Calendar,
    MapPin,
    Search
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
    DialogDescription
} from '@/components/ui/dialog'

interface Resume {
    id: string
    name: string
    file_url: string
    created_at: string
}

interface Job {
    id: string
    job_title: string
    company_name: string
    location: string | null
    status: string
    priority: string | null
    date_applied: string
    resume_id: string | null
}

interface ResumeManagerProps {
    initialResumes: Resume[]
    jobs: Job[]
    user: any
}

// Date formatting helper: DD-MM-YYYY
function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-')
    if (y && m && d) return `${d}-${m}-${y}`
    return dateStr
}

const statusColors: Record<string, string> = {
    'Applied': 'bg-blue-50/50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    'Assessment': 'bg-orange-50/50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40',
    'HR Interview': 'bg-purple-50/50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50',
    'Technical Interview': 'bg-violet-50/50 text-violet-600 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50',
    'Final Interview': 'bg-indigo-50/50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
    'Offer Received': 'bg-emerald-50/60 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    'Accepted': 'bg-green-50/50 text-green-600 border-green-200 dark:bg-green-950/25 dark:text-green-400 dark:border-green-900/50',
    'Rejected': 'bg-rose-50/50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
}

export default function ResumeManager({ initialResumes, jobs, user }: ResumeManagerProps) {
    const router = useRouter()
    const supabase = createClient()

    // Resumes state
    const [resumes, setResumes] = useState<Resume[]>(initialResumes)

    // Upload states
    const [resumeName, setResumeName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    // Delete states
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)

    // Rename states
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [isRenaming, setIsRenaming] = useState(false)

    // Linked jobs expand state
    const [expandedResumeId, setExpandedResumeId] = useState<string | null>(null)

    // Search
    const [searchQuery, setSearchQuery] = useState('')

    // Compute jobs linked to each resume
    const resumeJobsMap = useMemo(() => {
        const map: Record<string, Job[]> = {}
        jobs.forEach((job) => {
            if (job.resume_id) {
                if (!map[job.resume_id]) map[job.resume_id] = []
                map[job.resume_id].push(job)
            }
        })
        return map
    }, [jobs])

    // Filtered resumes
    const filteredResumes = useMemo(() => {
        if (!searchQuery.trim()) return resumes
        const q = searchQuery.toLowerCase().trim()
        return resumes.filter((r) => r.name.toLowerCase().includes(q))
    }, [resumes, searchQuery])

    // Stats
    const totalLinkedJobs = useMemo(() => {
        return resumes.reduce((acc, r) => acc + (resumeJobsMap[r.id]?.length || 0), 0)
    }, [resumes, resumeJobsMap])

    // FILE SELECTION
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF and DOC/DOCX files are allowed')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Resume file size must be less than 5MB')
            return
        }

        setSelectedFile(file)
        if (!resumeName) {
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
            setResumeName(nameWithoutExt)
        }
    }

    // UPLOAD ACTION
    const handleResumeUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            toast.error('Please select a resume file first')
            return
        }
        if (!resumeName.trim()) {
            toast.error('Please give your resume a display name')
            return
        }

        setIsUploading(true)
        try {
            const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
            const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath)

            const fileUrl = data.publicUrl

            const { data: dbData, error: dbError } = await supabase
                .from('resumes')
                .insert([{
                    user_id: user.id,
                    name: resumeName.trim(),
                    file_url: fileUrl,
                }])
                .select()
                .single()

            if (dbError) throw dbError

            setResumes((prev) => [dbData as Resume, ...prev])
            toast.success('Resume uploaded successfully')

            setResumeName('')
            setSelectedFile(null)
            setIsUploadOpen(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload resume')
        } finally {
            setIsUploading(false)
        }
    }

    // RENAME ACTION
    const handleStartRename = (resume: Resume) => {
        setEditingId(resume.id)
        setEditName(resume.name)
    }

    const handleCancelRename = () => {
        setEditingId(null)
        setEditName('')
    }

    const handleSaveRename = async (resumeId: string) => {
        if (!editName.trim()) {
            toast.error('Resume name cannot be empty')
            return
        }

        setIsRenaming(true)
        try {
            const { error } = await supabase
                .from('resumes')
                .update({ name: editName.trim() })
                .eq('id', resumeId)

            if (error) throw error

            setResumes((prev) =>
                prev.map((r) => r.id === resumeId ? { ...r, name: editName.trim() } : r)
            )
            toast.success('Resume renamed successfully')
            setEditingId(null)
            setEditName('')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to rename resume')
        } finally {
            setIsRenaming(false)
        }
    }

    // DELETE ACTION
    const handleOpenDeleteDialog = (resume: Resume) => {
        setResumeToDelete(resume)
        setIsDeleteOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!resumeToDelete) return

        setIsDeleting(true)
        setDeleteResumeId(resumeToDelete.id)

        try {
            const urlParts = resumeToDelete.file_url.split('/resumes/')
            const storagePath = urlParts[1]

            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('resumes')
                    .remove([storagePath])

                if (storageError) {
                    console.warn('Storage delete fail:', storageError)
                }
            }

            const { error: dbError } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeToDelete.id)

            if (dbError) throw dbError

            setResumes((prev) => prev.filter((r) => r.id !== resumeToDelete.id))
            toast.success('Resume deleted successfully')
            setIsDeleteOpen(false)
            setResumeToDelete(null)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete resume')
        } finally {
            setIsDeleting(false)
            setDeleteResumeId(null)
        }
    }

    // Toggle linked jobs
    const toggleLinkedJobs = (resumeId: string) => {
        setExpandedResumeId((prev) => (prev === resumeId ? null : resumeId))
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{resumes.length}</p>
                                <p className="text-xs text-zinc-500">Total Resumes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalLinkedJobs}</p>
                                <p className="text-xs text-zinc-500">Linked Applications</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {resumes.length > 0
                                        ? Math.round((resumes.filter((r) => (resumeJobsMap[r.id]?.length || 0) > 0).length / resumes.length) * 100)
                                        : 0}%
                                </p>
                                <p className="text-xs text-zinc-500">Resumes In Use</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Add */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resumes..."
                        className="pl-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                    />
                </div>

                <Button
                    onClick={() => {
                        setResumeName('')
                        setSelectedFile(null)
                        setIsUploadOpen(true)
                    }}
                    className="h-10 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                >
                    <Plus className="mr-2 h-4 w-4" /> Upload Resume
                </Button>
            </div>

            {/* Resume List */}
            {filteredResumes.length === 0 ? (
                <Card className="border border-dashed border-zinc-300 dark:border-zinc-800 py-16 flex flex-col items-center justify-center text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                        <FileText className="h-6 w-6 text-zinc-400" />
                    </div>
                    <CardTitle className="text-zinc-900 dark:text-white font-bold text-lg">
                        {searchQuery ? 'No matching resumes' : 'No resumes uploaded'}
                    </CardTitle>
                    <CardDescription className="text-sm text-zinc-500 mt-2 max-w-[280px]">
                        {searchQuery
                            ? 'Try a different search term.'
                            : 'Upload PDF or Word resumes to link with job applications.'}
                    </CardDescription>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredResumes.map((resume) => {
                        const linkedJobs = resumeJobsMap[resume.id] || []
                        const isExpanded = expandedResumeId === resume.id
                        const isEditingThis = editingId === resume.id

                        return (
                            <Card
                                key={resume.id}
                                className="border border-zinc-200/80 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/20 shadow-sm overflow-hidden transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0">
                                            <FileText className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                            {isEditingThis ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 text-sm font-bold border-zinc-300 dark:border-zinc-700 max-w-[300px]"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRename(resume.id)
                                                            if (e.key === 'Escape') handleCancelRename()
                                                        }}
                                                        disabled={isRenaming}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={() => handleSaveRename(resume.id)}
                                                        disabled={isRenaming}
                                                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                    >
                                                        {isRenaming ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={handleCancelRename}
                                                        disabled={isRenaming}
                                                        className="h-7 w-7 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                    {resume.name}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-zinc-500 mt-0.5">
                                                Uploaded {formatDate(resume.created_at.split('T')[0])}
                                                {linkedJobs.length > 0 && (
                                                    <span className="ml-2 text-blue-500 font-semibold">
                                                        • {linkedJobs.length} job{linkedJobs.length !== 1 ? 's' : ''} linked
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Linked Jobs Toggle */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleLinkedJobs(resume.id)}
                                            className={`h-8 text-xs font-semibold border-zinc-200 dark:border-zinc-700 ${linkedJobs.length === 0
                                                    ? 'text-zinc-400 cursor-default'
                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                                }`}
                                            disabled={linkedJobs.length === 0}
                                        >
                                            <Briefcase className="h-3 w-3 mr-1.5" />
                                            {linkedJobs.length} Job{linkedJobs.length !== 1 ? 's' : ''}
                                            {linkedJobs.length > 0 && (
                                                isExpanded
                                                    ? <ChevronUp className="h-3 w-3 ml-1" />
                                                    : <ChevronDown className="h-3 w-3 ml-1" />
                                            )}
                                        </Button>

                                        {/* View/Download */}
                                        <a
                                            href={resume.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 w-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>

                                        {/* Rename */}
                                        {!isEditingThis && (
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => handleStartRename(resume)}
                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}

                                        {/* Delete */}
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleOpenDeleteDialog(resume)}
                                            disabled={isDeleting && deleteResumeId === resume.id}
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        >
                                            {isDeleting && deleteResumeId === resume.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Linked Jobs Expanded Section */}
                                {isExpanded && linkedJobs.length > 0 && (
                                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
                                            Applications using this resume
                                        </p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {linkedJobs.map((job) => (
                                                <div
                                                    key={job.id}
                                                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/40 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                            {job.company_name}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                                                            {job.job_title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {job.location && (
                                                                <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                                                    <MapPin className="h-2.5 w-2.5" />
                                                                    {job.location}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                                                                <Calendar className="h-2.5 w-2.5" />
                                                                {formatDate(job.date_applied.split('T')[0])}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold border shrink-0 ml-2 ${statusColors[job.status] || 'bg-zinc-100'}`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* ============================================
                UPLOAD RESUME MODAL
            ============================================ */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Upload Resume
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1">
                            Select a file and set a display name
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleResumeUpload} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label htmlFor="resumeName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Display Name *
                            </label>
                            <Input
                                id="resumeName"
                                value={resumeName}
                                onChange={(e) => setResumeName(e.target.value)}
                                placeholder="e.g. Master Software Resume 2026"
                                disabled={isUploading}
                                className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                            />
                        </div>

                        <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                                Resume Document File *
                            </label>
                            <input
                                type="file"
                                id="resume-file-input"
                                className="hidden"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="resume-file-input"
                                className="flex flex-col items-center justify-center gap-1.5 w-full h-20 border-dashed border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 cursor-pointer rounded-lg transition-colors"
                            >
                                <Upload className="h-5 w-5 text-zinc-400" />
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    {selectedFile ? selectedFile.name : 'Choose File / Drop Resume Here'}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-semibold font-mono">
                                    PDF, DOC, DOCX up to 5MB
                                </span>
                            </label>
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUploadOpen(false)}
                                disabled={isUploading}
                                className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUploading}
                                className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    'Upload Resume'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ============================================
                DELETE CONFIRMATION MODAL
            ============================================ */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Delete Resume
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1.5">
                            Are you sure you want to delete this resume? This action is permanent and cannot be undone.
                            {resumeToDelete && (resumeJobsMap[resumeToDelete.id]?.length || 0) > 0 && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-semibold">
                                    ⚠ This resume is linked to {resumeJobsMap[resumeToDelete.id]?.length} job application(s). The link will be removed.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {resumeToDelete && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 my-2">
                            <span className="text-xs text-zinc-500 block">Resume to delete:</span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white block mt-0.5">
                                {resumeToDelete.name}
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
                            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
