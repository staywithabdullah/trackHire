'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    Plus,
    Search,
    Table as TableIcon,
    LayoutGrid,
    Filter,
    ArrowUpDown,
    Edit2,
    Trash2,
    Eye,
    ExternalLink,
    ChevronDown,
    AlertTriangle,
    Briefcase,
    Calendar,
    DollarSign,
    MapPin,
    FileText
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Statuses, Priorities, and Employment Types
const STATUS_OPTIONS = [
    'Applied',
    'Assessment',
    'HR Interview',
    'Technical Interview',
    'Final Interview',
    'Offer Received',
    'Accepted',
    'Rejected'
] as const

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const

const EMPLOYMENT_TYPES = [
    'Full-Time',
    'Part-Time',
    'Internship',
    'Contract',
    'Freelance',
    'Remote',
    'Hybrid'
] as const

type JobStatus = typeof STATUS_OPTIONS[number]
type JobPriority = typeof PRIORITY_OPTIONS[number]
type EmploymentType = typeof EMPLOYMENT_TYPES[number]

interface Resume {
    id: string
    name: string
    file_url: string
}

interface Job {
    id: string
    user_id: string
    job_title: string
    company_name: string
    company_website: string | null
    job_post_url: string | null
    location: string | null
    employment_type: EmploymentType | null
    salary: string | null
    resume_id: string | null
    priority: JobPriority | null
    status: JobStatus
    notes: string | null
    date_applied: string
    created_at: string
    updated_at: string
}

// Zod Schema for validation (allows query strings and special characters in paths/queries)
const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?$/

const jobSchema = zod.object({
    job_title: zod.string().min(1, 'Job Title is required').max(100, 'Title limit is 100 characters'),
    company_name: zod.string().min(1, 'Company Name is required').max(100, 'Company limit is 100 characters'),
    company_website: zod.string().regex(urlRegex, 'Enter a valid URL').or(zod.literal('')),
    job_post_url: zod.string().regex(urlRegex, 'Enter a valid URL').or(zod.literal('')),
    location: zod.string().max(80, 'Location limit is 80 characters').or(zod.literal('')),
    employment_type: zod.string().or(zod.literal('')),
    salary: zod.string().max(50, 'Salary limit is 50 characters').or(zod.literal('')),
    resume_id: zod.string().or(zod.literal('')),
    priority: zod.string().or(zod.literal('')),
    status: zod.string().min(1, 'Status is required'),
    notes: zod.string().max(1000, 'Notes limit is 1000 characters').or(zod.literal('')),
    date_applied: zod.string().min(10, 'Requires format YYYY-MM-DD'),
})

type JobFormValues = zod.infer<typeof jobSchema>

interface JobTrackerProps {
    initialJobs: Job[]
    resumes: Resume[]
    userId: string
}

export default function JobTracker({ initialJobs, resumes, userId }: JobTrackerProps) {
    const router = useRouter()
    const supabase = createClient()

    // Jobs state
    const [jobs, setJobs] = useState<Job[]>(initialJobs)
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [employmentFilter, setEmploymentFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('newest')

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // React Hook Form for Add and Edit
    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            job_title: '',
            company_name: '',
            company_website: '',
            job_post_url: '',
            location: '',
            employment_type: 'Full-Time',
            salary: '',
            resume_id: 'none',
            priority: 'Medium',
            status: 'Applied',
            notes: '',
            date_applied: new Date().toISOString().split('T')[0],
        },
    })

    // Watch company and title to show duplicate warning
    const watchedCompany = form.watch('company_name')
    const watchedTitle = form.watch('job_title')

    const isDuplicate = useMemo(() => {
        if (!watchedCompany || !watchedTitle) return false
        return jobs.some(
            (job) =>
                job.company_name.toLowerCase().trim() === watchedCompany.toLowerCase().trim() &&
                job.job_title.toLowerCase().trim() === watchedTitle.toLowerCase().trim() &&
                job.id !== selectedJob?.id
        )
    }, [watchedCompany, watchedTitle, jobs, selectedJob])

    // Reset form helper
    const handleOpenAddModal = () => {
        setSelectedJob(null)
        form.reset({
            job_title: '',
            company_name: '',
            company_website: '',
            job_post_url: '',
            location: '',
            employment_type: 'Full-Time',
            salary: '',
            resume_id: 'none',
            priority: 'Medium',
            status: 'Applied',
            notes: '',
            date_applied: new Date().toISOString().split('T')[0],
        })
        setIsAddOpen(true)
    }

    const handleOpenEditModal = (job: Job) => {
        setSelectedJob(job)
        form.reset({
            job_title: job.job_title,
            company_name: job.company_name,
            company_website: job.company_website || '',
            job_post_url: job.job_post_url || '',
            location: job.location || '',
            employment_type: job.employment_type || 'Full-Time',
            salary: job.salary || '',
            resume_id: job.resume_id || 'none',
            priority: job.priority || 'Medium',
            status: job.status,
            notes: job.notes || '',
            date_applied: job.date_applied.split('T')[0],
        })
        setIsEditOpen(true)
    }

    const handleOpenDeleteModal = (job: Job) => {
        setSelectedJob(job)
        setIsDeleteOpen(true)
    }

    const handleOpenDetails = (job: Job) => {
        setSelectedJob(job)
        setIsDetailsOpen(true)
    }

    // CREATE / UPDATE ACTION
    const onSubmit = async (values: JobFormValues) => {
        setSubmitting(true)

        // Formatting values
        const payload = {
            user_id: userId,
            job_title: values.job_title,
            company_name: values.company_name,
            company_website: values.company_website || null,
            job_post_url: values.job_post_url || null,
            location: values.location || null,
            employment_type: values.employment_type || null,
            salary: values.salary || null,
            resume_id: (values.resume_id && values.resume_id !== 'none') ? values.resume_id : null,
            priority: values.priority || null,
            status: values.status as JobStatus,
            notes: values.notes || null,
            date_applied: values.date_applied,
        }

        try {
            if (selectedJob) {
                // Edit mode
                const { data, error } = await supabase
                    .from('jobs')
                    .update(payload)
                    .eq('id', selectedJob.id)
                    .select()
                    .single()

                if (error) throw error

                setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? (data as Job) : j)))
                toast.success('Job application updated successfully')
                setIsEditOpen(false)
            } else {
                // Add mode
                const { data, error } = await supabase
                    .from('jobs')
                    .insert([payload])
                    .select()
                    .single()

                if (error) throw error

                setJobs((prev) => [data as Job, ...prev])
                toast.success('Job application added successfully')
                setIsAddOpen(false)
            }
            form.reset()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // DELETE ACTION
    const handleDeleteConfirm = async () => {
        if (!selectedJob) return
        setSubmitting(true)
        try {
            const { error } = await supabase.from('jobs').delete().eq('id', selectedJob.id)
            if (error) throw error

            setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id))
            toast.success('Job application deleted successfully')
            setIsDeleteOpen(false)
            setSelectedJob(null)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Could not delete application')
        } finally {
            setSubmitting(false)
        }
    }

    // Search, Filter, Sort local computation
    const filteredJobs = useMemo(() => {
        return jobs
            .filter((job) => {
                // Search Filter
                const query = searchQuery.toLowerCase().trim()
                if (query) {
                    const matchTitle = job.job_title.toLowerCase().includes(query)
                    const matchCompany = job.company_name.toLowerCase().includes(query)
                    const matchLocation = job.location?.toLowerCase().includes(query) || false
                    const matchNotes = job.notes?.toLowerCase().includes(query) || false
                    if (!matchTitle && !matchCompany && !matchLocation && !matchNotes) return false
                }

                // Status Tabs Filter
                if (activeTab !== 'all' && job.status !== activeTab) return false

                // Priority Filter
                if (priorityFilter !== 'all' && job.priority !== priorityFilter) return false

                // Employment Type Filter
                if (employmentFilter !== 'all' && job.employment_type !== employmentFilter) return false

                return true
            })
            .sort((a, b) => {
                // Sorting logic
                if (sortBy === 'newest') {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                }
                if (sortBy === 'oldest') {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                }
                if (sortBy === 'company') {
                    return a.company_name.localeCompare(b.company_name)
                }
                if (sortBy === 'job_title') {
                    return a.job_title.localeCompare(b.job_title)
                }
                if (sortBy === 'status') {
                    return a.status.localeCompare(b.status)
                }
                return 0
            })
    }, [jobs, searchQuery, activeTab, priorityFilter, employmentFilter, sortBy])

    // Color mappings
    const priorityColors = {
        High: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50',
        Medium: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50',
        Low: 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
    }

    const statusColors = {
        'Applied': 'bg-blue-50/50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
        'Assessment': 'bg-orange-50/50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/40',
        'HR Interview': 'bg-purple-50/50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50',
        'Technical Interview': 'bg-violet-50/50 text-violet-600 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50',
        'Final Interview': 'bg-indigo-50/50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
        'Offer Received': 'bg-emerald-50/60 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        'Accepted': 'bg-green-50/50 text-green-600 border-green-200 dark:bg-green-950/25 dark:text-green-400 dark:border-green-900/50',
        'Rejected': 'bg-rose-50/50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
    }

    return (
        <div className="space-y-6">
            {/* Top Filter Bar Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4 dark:border-zinc-850">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search Inputs */}
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search title, company, location..."
                            className="pl-10 h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                        />
                    </div>

                    <div className="flex gap-2">
                        {/* Priority Filter */}
                        <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || 'all')}>
                            <SelectTrigger className="h-10 w-[125px] border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Priority: All</SelectItem>
                                {PRIORITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Employment Type Filter */}
                        <Select value={employmentFilter} onValueChange={(val) => setEmploymentFilter(val || 'all')}>
                            <SelectTrigger className="h-10 w-[145px] border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                <SelectValue placeholder="Job Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Type: All</SelectItem>
                                {EMPLOYMENT_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sorting */}
                        <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
                            <SelectTrigger className="h-10 w-[135px] border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Sort: Newest</SelectItem>
                                <SelectItem value="oldest">Sort: Oldest</SelectItem>
                                <SelectItem value="company">Sort: Company</SelectItem>
                                <SelectItem value="job_title">Sort: Job Name</SelectItem>
                                <SelectItem value="status">Sort: Status</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* View Switches & Add Button */}
                <div className="flex items-center gap-3 justify-end">
                    <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => setViewMode('table')}
                            className="h-8 w-8"
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => setViewMode('card')}
                            className="h-8 w-8"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={handleOpenAddModal}
                        className="h-10 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Application
                    </Button>
                </div>
            </div>

            {/* Tabs Filter (Applied, Assessment, HR Interview, Technical Interview, Final Interview, Offer Received, Accepted, Rejected) */}
            <div className="overflow-x-auto pb-1">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 p-1 flex w-max gap-1">
                        <TabsTrigger value="all" className="px-3.5 py-1.5 text-xs">All Applications</TabsTrigger>
                        {STATUS_OPTIONS.map((status) => (
                            <TabsTrigger key={status} value={status} className="px-3.5 py-1.5 text-xs">
                                {status}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Main Jobs List Render */}
            {filteredJobs.length === 0 ? (
                <Card className="border border-dashed border-zinc-300 dark:border-zinc-800 py-16 flex flex-col items-center justify-center text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                        <Briefcase className="h-6 w-6 text-zinc-400" />
                    </div>
                    <CardTitle className="text-zinc-900 dark:text-white font-bold text-lg">No job applications</CardTitle>
                    <CardDescription className="text-sm text-zinc-500 mt-2 max-w-[280px]">
                        No job applications matches your filter queries. Add a new application or modify filters.
                    </CardDescription>
                </Card>
            ) : viewMode === 'table' ? (
                /* Table View */
                <div className="rounded-xl border border-zinc-100 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                            <TableRow>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Job Title</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Company</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Status</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Priority</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Location</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100">Date Applied</TableHead>
                                <TableHead className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobs.map((job) => (
                                <TableRow
                                    key={job.id}
                                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all cursor-pointer"
                                    onClick={() => handleOpenDetails(job)}
                                >
                                    <TableCell className="font-bold text-zinc-900 dark:text-white">
                                        {job.job_title}
                                    </TableCell>
                                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                                        <div className="flex items-center gap-1.5">
                                            <span>{job.company_name}</span>
                                            {job.company_website && (
                                                <a
                                                    href={job.company_website.startsWith('http') ? job.company_website : `https://${job.company_website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${statusColors[job.status] || 'bg-zinc-100'}`}>
                                            {job.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {job.priority ? (
                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColors[job.priority] || 'bg-zinc-100'}`}>
                                                {job.priority}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">
                                        {job.location || 'Remote/Hybrid'}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">
                                        {job.date_applied}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => handleOpenEditModal(job)}
                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => handleOpenDeleteModal(job)}
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                /* Card View */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <Card
                            key={job.id}
                            className="border border-zinc-200/80 bg-white/60 hover:bg-zinc-50/30 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40 transition-all cursor-pointer shadow-sm relative group"
                            onClick={() => handleOpenDetails(job)}
                        >
                            <CardHeader className="pb-3.5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate block font-medium">
                                            {job.company_name}
                                        </span>
                                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white truncate block mt-0.5">
                                            {job.job_title}
                                        </CardTitle>
                                    </div>
                                    {job.priority && (
                                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${priorityColors[job.priority] || 'bg-zinc-100'}`}>
                                            {job.priority}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>{job.location || 'Remote/Hybrid'}</span>
                                </div>
                                {job.salary && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{job.salary}</span>
                                    </div>
                                )}
                                {job.employment_type && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{job.employment_type}</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-3 border-t border-zinc-100/80 dark:border-zinc-800/80 flex justify-between items-center">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${statusColors[job.status] || 'bg-zinc-100'}`}>
                                    {job.status}
                                </span>

                                <div
                                    className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => handleOpenEditModal(job)}
                                        className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => handleOpenDeleteModal(job)}
                                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* ==============================================
          ADD / EDIT APPLICATION MODAL
          ============================================== */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false)
                    setIsEditOpen(false)
                }
            }}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {selectedJob ? 'Edit Application' : 'Add New Application'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Details for your job application tracker database
                        </DialogDescription>
                    </DialogHeader>

                    {isDuplicate && (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-600 dark:bg-amber-955/20 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Warning: An application for this job title at this company already exists.</span>
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Job Title */}
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Job Title *
                                </label>
                                <Input
                                    {...form.register('job_title')}
                                    placeholder="e.g. Frontend Engineer"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                />
                                {form.formState.errors.job_title && (
                                    <p className="text-xs text-red-500">{form.formState.errors.job_title.message}</p>
                                )}
                            </div>

                            {/* Company Name */}
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Company Name *
                                </label>
                                <Input
                                    {...form.register('company_name')}
                                    placeholder="e.g. OpenAI"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                />
                                {form.formState.errors.company_name && (
                                    <p className="text-xs text-red-500">{form.formState.errors.company_name.message}</p>
                                )}
                            </div>

                            {/* Company Website */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Company Website
                                </label>
                                <Input
                                    {...form.register('company_website')}
                                    placeholder="e.g. openai.com"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                    type="text"
                                />
                                {form.formState.errors.company_website && (
                                    <p className="text-xs text-red-500">{form.formState.errors.company_website.message}</p>
                                )}
                            </div>

                            {/* Job post URL */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Job Post URL
                                </label>
                                <Input
                                    {...form.register('job_post_url')}
                                    placeholder="e.g. linkedin.com/..."
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                    type="text"
                                />
                                {form.formState.errors.job_post_url && (
                                    <p className="text-xs text-red-500">{form.formState.errors.job_post_url.message}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Location
                                </label>
                                <Input
                                    {...form.register('location')}
                                    placeholder="e.g. San Francisco, CA"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                />
                                {form.formState.errors.location && (
                                    <p className="text-xs text-red-500">{form.formState.errors.location.message}</p>
                                )}
                            </div>

                            {/* Salary */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Salary Range
                                </label>
                                <Input
                                    {...form.register('salary')}
                                    placeholder="e.g. $120k - $140k"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                                />
                                {form.formState.errors.salary && (
                                    <p className="text-xs text-red-500">{form.formState.errors.salary.message}</p>
                                )}
                            </div>

                            {/* Employment Type */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Employment Type
                                </label>
                                <Select
                                    value={form.watch('employment_type') || 'Full-Time'}
                                    onValueChange={(val) => form.setValue('employment_type', val || '')}
                                >
                                    <SelectTrigger className="h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMPLOYMENT_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Priority
                                </label>
                                <Select
                                    value={form.watch('priority') || 'Medium'}
                                    onValueChange={(val) => form.setValue('priority', val || '')}
                                >
                                    <SelectTrigger className="h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <SelectItem key={opt} value={opt}>
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Application Status
                                </label>
                                <Select
                                    value={form.watch('status') || 'Applied'}
                                    onValueChange={(val) => form.setValue('status', val || 'Applied')}
                                >
                                    <SelectTrigger className="h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Applied */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Date Applied
                                </label>
                                <Input
                                    {...form.register('date_applied')}
                                    type="date"
                                    disabled={submitting}
                                    className="h-10 border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                                />
                                {form.formState.errors.date_applied && (
                                    <p className="text-xs text-red-500">{form.formState.errors.date_applied.message}</p>
                                )}
                            </div>

                            {/* Resume Used */}
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Resume Used
                                </label>
                                <Select
                                    value={form.watch('resume_id') || 'none'}
                                    onValueChange={(val) => form.setValue('resume_id', val || 'none')}
                                >
                                    <SelectTrigger className="h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                                        <SelectValue placeholder="Select resume" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None / Select later</SelectItem>
                                        {resumes.map((res) => (
                                            <SelectItem key={res.id} value={res.id}>
                                                {res.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Notes
                                </label>
                                <Textarea
                                    {...form.register('notes')}
                                    placeholder="Insert notes, description, interviewer contact info..."
                                    disabled={submitting}
                                    rows={3}
                                    className="border-zinc-200 bg-white/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 text-xs"
                                />
                                {form.formState.errors.notes && (
                                    <p className="text-xs text-red-500">{form.formState.errors.notes.message}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddOpen(false)
                                    setIsEditOpen(false)
                                }}
                                disabled={submitting}
                                className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                            >
                                {submitting ? 'Submitting...' : selectedJob ? 'Save Changes' : 'Add Application'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ==============================================
          DELETE CONFIRMATION MODAL
          ============================================== */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Delete Application
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-1.5">
                            Are you sure you want to delete this job application? This action is permanent and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedJob && (
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 my-2">
                            <span className="text-xs text-zinc-500 block">Application to delete:</span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white block mt-0.5">
                                {selectedJob.job_title} at {selectedJob.company_name}
                            </span>
                        </div>
                    )}

                    <DialogFooter className="gap-2 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={submitting}
                            className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={submitting}
                            className="h-10 font-semibold"
                        >
                            {submitting ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ==============================================
          JOB DETAILS SIDE DIALOG / SHEET PANEL
          ============================================== */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    {selectedJob && (
                        <>
                            <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <span className="text-xs text-zinc-500 font-medium block">
                                            {selectedJob.company_name}
                                        </span>
                                        <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                                            {selectedJob.job_title}
                                        </DialogTitle>
                                    </div>
                                    {selectedJob.priority && (
                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider shrink-0 ${priorityColors[selectedJob.priority] || 'bg-zinc-100'}`}>
                                            {selectedJob.priority}
                                        </span>
                                    )}
                                </div>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Status */}
                                    <div className="space-y-1 col-span-2 sm:col-span-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Application Status</span>
                                        <div className="pt-1">
                                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${statusColors[selectedJob.status] || 'bg-zinc-100'}`}>
                                                {selectedJob.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Progress Timeline */}
                                <div className="space-y-3.5 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Status Pipeline Timeline</span>
                                    <div className="grid grid-cols-4 gap-2 pt-1.5 relative">
                                        {/* Horizontal indicator bar backplates */}
                                        {[
                                            { title: 'Applied', active: ['Applied', 'Assessment', 'HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted', 'Rejected'].includes(selectedJob.status) },
                                            { title: 'Assessment', active: ['Assessment', 'HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted', 'Rejected'].includes(selectedJob.status) },
                                            { title: 'Interviewing', active: ['HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted', 'Rejected'].includes(selectedJob.status) },
                                            { title: 'Decision', active: ['Offer Received', 'Accepted', 'Rejected'].includes(selectedJob.status) },
                                        ].map((step, idx) => {
                                            const isDecisionRejected = step.title === 'Decision' && selectedJob.status === 'Rejected'
                                            return (
                                                <div key={idx} className="flex flex-col gap-2">
                                                    <div className={`h-1.5 rounded-full transition-colors ${step.active
                                                        ? isDecisionRejected
                                                            ? 'bg-rose-500'
                                                            : selectedJob.status === 'Accepted'
                                                                ? 'bg-green-500'
                                                                : 'bg-zinc-900 dark:bg-zinc-100'
                                                        : 'bg-zinc-200 dark:bg-zinc-800'
                                                        }`} />
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[10px] font-bold text-zinc-900 dark:text-white">
                                                            {step.title}
                                                        </span>
                                                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                            {step.title === 'Applied' && 'Logged'}
                                                            {step.title === 'Assessment' && 'Take-home/Quiz'}
                                                            {step.title === 'Interviewing' && 'Interviews'}
                                                            {step.title === 'Decision' && (
                                                                selectedJob.status === 'Rejected'
                                                                    ? 'Rejected'
                                                                    : selectedJob.status === 'Accepted'
                                                                        ? 'Accepted'
                                                                        : selectedJob.status === 'Offer Received'
                                                                            ? 'Offer Received'
                                                                            : 'Pending Outcome'
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date Applied */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Date Applied</span>
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-white pt-1">
                                            <Calendar className="h-4 w-4 text-zinc-400" />
                                            <span>{selectedJob.date_applied}</span>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Location</span>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 pt-1">
                                            <MapPin className="h-4 w-4 text-zinc-400" />
                                            <span>{selectedJob.location || 'Remote/Hybrid'}</span>
                                        </div>
                                    </div>

                                    {/* Employment Type */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Employment Type</span>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 pt-1">
                                            <Briefcase className="h-4 w-4 text-zinc-400" />
                                            <span>{selectedJob.employment_type || 'Full-Time'}</span>
                                        </div>
                                    </div>

                                    {/* Salary */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Salary Range</span>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 pt-1 font-mono">
                                            <DollarSign className="h-4 w-4 text-zinc-400" />
                                            <span>{selectedJob.salary || 'Not specified'}</span>
                                        </div>
                                    </div>

                                    {/* Resume Used */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Resume Used</span>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 pt-1">
                                            <FileText className="h-4 w-4 text-zinc-400" />
                                            <span>
                                                {resumes.find((r) => r.id === selectedJob.resume_id)?.name || 'No resume linked'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* URLs */}
                                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3 text-xs flex gap-4">
                                    {selectedJob.company_website && (
                                        <a
                                            href={selectedJob.company_website.startsWith('http') ? selectedJob.company_website : `https://${selectedJob.company_website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Company Website
                                        </a>
                                    )}
                                    {selectedJob.job_post_url && (
                                        <a
                                            href={selectedJob.job_post_url.startsWith('http') ? selectedJob.job_post_url : `https://${selectedJob.job_post_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Original Job Post Link
                                        </a>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Notes & Comments</span>
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 min-h-[80px] whitespace-pre-wrap mt-1">
                                        {selectedJob.notes || 'No description notes entered for this job.'}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="pt-2 text-[10px] text-zinc-400 flex justify-between">
                                    <span>Created: {new Date(selectedJob.created_at).toLocaleDateString()}</span>
                                    <span>Last Updated: {new Date(selectedJob.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <DialogFooter className="border-t border-zinc-100 dark:border-zinc-900 pt-3 flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="h-10 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                                >
                                    Close Detail
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setIsDetailsOpen(false)
                                            handleOpenEditModal(selectedJob)
                                        }}
                                        className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950 font-semibold"
                                    >
                                        Edit Details
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
