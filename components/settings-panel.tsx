'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    FileText,
    Upload,
    Trash2,
    Download,
    Loader2,
    ExternalLink,
    Plus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
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
    created_at: string
    date_applied: string
    notes: string | null
}

interface SettingsPanelProps {
    initialResumes: Resume[]
    jobs: Job[]
    user: any
}

export default function SettingsPanel({ initialResumes, jobs, user }: SettingsPanelProps) {
    const router = useRouter()
    const supabase = createClient()

    // Resumes list
    const [resumes, setResumes] = useState<Resume[]>(initialResumes)

    // States
    const [resumeName, setResumeName] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Loader states
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null)

    // Dialog state
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    // FILE SELECTION ACTION
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Limit to PDF and Word documents
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only PDF and DOC/DOCX files are allowed')
            return
        }

        // Limit size - 5MB
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Resume file size must be less than 5MB')
            return
        }

        setSelectedFile(file)
        // Auto-populate resume name with file name (sans extension) if empty
        if (!resumeName) {
            const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
            setResumeName(nameWithoutExt)
        }
    }

    // RESUME UPLOAD ACTION
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
            // 1. Upload file to Supabase bucket isolated by userId folder
            const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
            const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // 2. Fetch public URL
            const { data } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath)

            const fileUrl = data.publicUrl

            // 3. Save resume metadata to resumes table
            const { data: dbData, error: dbError } = await supabase
                .from('resumes')
                .insert([
                    {
                        user_id: user.id,
                        name: resumeName.trim(),
                        file_url: fileUrl,
                    }
                ])
                .select()
                .single()

            if (dbError) throw dbError

            setResumes((prev) => [dbData as Resume, ...prev])
            toast.success('Resume uploaded successfully')

            // Reset form
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

    // RESUME DELETE ACTION
    const handleDeleteResume = async (resumeId: string) => {
        setDeleteResumeId(resumeId)
        setIsDeleting(true)

        try {
            const resume = resumes.find((r) => r.id === resumeId)
            if (!resume) throw new Error('Resume not found')

            // Extract storage path from fileUrl
            // Public URL structure is ".../storage/v1/object/public/resumes/{user_id}/{filename}"
            // We want to delete "{user_id}/{filename}"
            const urlParts = resume.file_url.split('/resumes/')
            const storagePath = urlParts[1]

            if (storagePath) {
                // Delete from Storage bucket
                const { error: storageError } = await supabase.storage
                    .from('resumes')
                    .remove([storagePath])

                // Do not block database deletion if file might not exist in storage
                if (storageError) {
                    console.warn('Storage delete fail:', storageError)
                }
            }

            // Delete from resumes table
            const { error: dbError } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId)

            if (dbError) throw dbError

            setResumes((prev) => prev.filter((r) => r.id !== resumeId))
            toast.success('Resume deleted successfully')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete resume')
        } finally {
            setIsDeleting(false)
            setDeleteResumeId(null)
        }
    }

    // DATA EXPORT ACTION (JSON format)
    const handleExportJSON = () => {
        try {
            if (jobs.length === 0) {
                toast.info('No job applications to export')
                return
            }

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(jobs, null, 2)
            )}`

            const downloadAnchor = document.createElement('a')
            downloadAnchor.setAttribute('href', jsonString)
            downloadAnchor.setAttribute('download', `trackhire_export_${new Date().toISOString().split('T')[0]}.json`)
            document.body.appendChild(downloadAnchor)
            downloadAnchor.click()
            downloadAnchor.remove()

            toast.success('Job application backup JSON downloaded!')
        } catch (err) {
            toast.error('Failed to export JSON file')
        }
    }

    // DATA EXPORT ACTION (CSV format)
    const handleExportCSV = () => {
        try {
            if (jobs.length === 0) {
                toast.info('No job applications to export')
                return
            }

            // Define CSV columns
            const headers = ['job_title', 'company_name', 'status', 'priority', 'location', 'date_applied', 'created_at', 'notes']
            const rows = jobs.map((job) => {
                return headers.map((header) => {
                    const val = job[header as keyof Job] || ''
                    // Escape quotes
                    const escapedVal = String(val).replace(/"/g, '""')
                    return `"${escapedVal}"`
                }).join(',')
            })

            const csvContent = `data:text/csv;charset=utf-8,${[
                headers.join(','),
                ...rows
            ].join('\n')}`

            const downloadAnchor = document.createElement('a')
            downloadAnchor.setAttribute('href', encodeURI(csvContent))
            downloadAnchor.setAttribute('download', `trackhire_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(downloadAnchor)
            downloadAnchor.click()
            downloadAnchor.remove()

            toast.success('Job application spreadsheet CSV downloaded!')
        } catch (err) {
            toast.error('Failed to export CSV file')
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Resumes Management Panel */}
            <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 md:col-span-2 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Uploaded Resumes</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Link resumes to job postings for tracking</CardDescription>
                    </div>
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        size="sm"
                        className="h-9 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Resume
                    </Button>
                </CardHeader>
                <CardContent>
                    {resumes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/10">
                            <FileText className="h-8 w-8 text-zinc-400 mb-2.5" />
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No resumes uploaded</span>
                            <span className="text-xs text-zinc-500 mt-1 max-w-[220px] text-center">Upload PDF or Word resumes to link with job tracker.</span>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {resumes.map((resume) => (
                                <div
                                    key={resume.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-white/70 hover:bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/35 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                            <FileText className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                                {resume.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 mt-0.5">
                                                Uploaded {new Date(resume.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <a
                                            href={resume.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 w-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 hover:text-zinc-950 dark:hover:text-zinc-100"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>

                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleDeleteResume(resume.id)}
                                            disabled={isDeleting && deleteResumeId === resume.id}
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100"
                                        >
                                            {isDeleting && deleteResumeId === resume.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Database Operations & Backup */}
            <div className="space-y-6">
                {/* Export Data */}
                <Card className="border border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Backup & Exports</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Save localized backups of all logged applications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3.5">
                        <Button
                            onClick={handleExportJSON}
                            variant="outline"
                            className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 justify-start"
                        >
                            <Download className="h-4 w-4 mr-2 text-zinc-500" />
                            Download JSON Backup
                        </Button>
                        <Button
                            onClick={handleExportCSV}
                            variant="outline"
                            className="w-full h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 justify-start"
                        >
                            <Download className="h-4 w-4 mr-2 text-zinc-500" />
                            Export to Excel (CSV)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ==============================================
          UPLOAD RESUME MODAL
          ============================================== */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Add Resume Document
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1">
                            Select a file and set a label to save
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleResumeUpload} className="space-y-4 py-2">
                        {/* Display Name */}
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

                        {/* File Select */}
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
        </div>
    )
}
