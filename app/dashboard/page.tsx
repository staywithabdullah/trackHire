import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
    Briefcase,
    Layers,
    MessageSquare,
    Trophy,
    CheckCircle,
    XCircle,
    Plus,
    ArrowRight,
    ExternalLink,
    ChevronRight,
    TrendingUp,
    User
} from 'lucide-react'

// Define Job Status type
type JobStatus =
    | 'Applied'
    | 'Assessment'
    | 'HR Interview'
    | 'Technical Interview'
    | 'Final Interview'
    | 'Offer Received'
    | 'Accepted'
    | 'Rejected'

interface Job {
    id: string
    job_title: string
    company_name: string
    location: string | null
    status: JobStatus
    priority: 'High' | 'Medium' | 'Low' | null
    created_at: string
    date_applied: string
}

export default async function DashboardPage() {
    const supabase = await createClient()

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch jobs
    const { data: jobsRaw } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })

    const jobs = (jobsRaw || []) as Job[]

    // Stats calculation
    const total = jobs.length
    const applied = jobs.filter((j) => j.status === 'Applied').length
    const interview = jobs.filter((j) =>
        ['Assessment', 'HR Interview', 'Technical Interview', 'Final Interview'].includes(j.status)
    ).length
    const offers = jobs.filter((j) => j.status === 'Offer Received').length
    const accepted = jobs.filter((j) => j.status === 'Accepted').length
    const rejected = jobs.filter((j) => j.status === 'Rejected').length

    const recentJobs = jobs.slice(0, 5)

    // Status mapping for background badges
    const statusConfig: Record<JobStatus, { text: string; bg: string; textClass: string }> = {
        'Applied': { text: 'Applied', bg: 'bg-blue-50 dark:bg-blue-950/30', textClass: 'text-blue-600 dark:text-blue-400' },
        'Assessment': { text: 'Assessment', bg: 'bg-amber-50 dark:bg-amber-950/30', textClass: 'text-amber-600 dark:text-amber-400' },
        'HR Interview': { text: 'HR Interview', bg: 'bg-purple-50 dark:bg-purple-950/30', textClass: 'text-purple-600 dark:text-purple-400' },
        'Technical Interview': { text: 'Technical Interview', bg: 'bg-violet-50 dark:bg-violet-950/30', textClass: 'text-violet-600 dark:text-violet-400' },
        'Final Interview': { text: 'Final Interview', bg: 'bg-indigo-50 dark:bg-indigo-950/30', textClass: 'text-indigo-600 dark:text-indigo-400' },
        'Offer Received': { text: 'Offer Received', bg: 'bg-emerald-50 dark:bg-emerald-950/30', textClass: 'text-emerald-600 dark:text-emerald-400 font-semibold' },
        'Accepted': { text: 'Accepted', bg: 'bg-green-50 dark:bg-green-950/30', textClass: 'text-green-600 dark:text-green-400' },
        'Rejected': { text: 'Rejected', bg: 'bg-rose-50 dark:bg-rose-950/30', textClass: 'text-rose-600 dark:text-rose-400' },
    }

    // Calculate Success Rate: Offers / (Accepted + Rejected + Offers + Interview + Applied)
    const successRate = total > 0 ? Math.round(((offers + accepted) / total) * 100) : 0

    return (
        <div className="space-y-8">
            {/* Header Page Title */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Welcome to TrackHire
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Here's an overview of your active job application funnel
                    </p>
                </div>
                <div>
                    <Link href="/dashboard/jobs?add=true">
                        <Button className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 transition-colors font-medium flex items-center justify-center gap-1.5 shadow-sm">
                            <Plus className="h-4 w-4" />
                            Add Application
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Total
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{total}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Applications</p>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Applied
                        </CardTitle>
                        <Layers className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{applied}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Initial stage</p>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Interviews
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{interview}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Meeting teams</p>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Offers
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{offers}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Received</p>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Accepted
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{accepted}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Hired</p>
                    </CardContent>
                </Card>

                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Rejected
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{rejected}</div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Closed application</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Grid for Analytics and Recent Items */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Recent Applications */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Recent Applications</CardTitle>
                            <CardDescription className="text-xs text-zinc-500">Your latest job submissions</CardDescription>
                        </div>
                        <Link href="/dashboard/jobs" className="text-xs text-zinc-500 hover:underline dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                            View Tracker <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Briefcase className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">No applications yet</span>
                                <span className="text-xs text-zinc-500 mt-1 max-w-[200px]">Add your first job application to start tracking it.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentJobs.map((job) => {
                                    const status = statusConfig[job.status] || { text: job.status, bg: 'bg-zinc-100', textClass: 'text-zinc-600' }
                                    return (
                                        <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-white/70 hover:bg-zinc-50/50 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/35 transition-all">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                    {job.job_title}
                                                </span>
                                                <span className="text-xs text-zinc-500 truncate mt-0.5">
                                                    {job.company_name} — {job.location || 'Remote/Hybrid'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${status.bg} ${status.textClass} tracking-wide`}>
                                                    {status.text}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Success Rate & Quick Stats */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Active Insights</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Summary statistics and metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Success rate Circle */}
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50/50 border border-zinc-100 dark:bg-zinc-950/40 dark:border-zinc-800">
                            <div className="relative flex items-center justify-center h-28 w-28">
                                {/* SVG Progress Circle */}
                                <svg className="absolute w-full h-full transform -rotate-90">
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        className="text-zinc-200 dark:text-zinc-800"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="56"
                                        cy="56"
                                        r="48"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        className="text-zinc-900 dark:text-zinc-100"
                                        strokeDasharray={2 * Math.PI * 48}
                                        strokeDashoffset={2 * Math.PI * 48 * (1 - successRate / 100)}
                                        strokeLinecap="round"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-bold text-zinc-900 dark:text-white">{successRate}%</span>
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold mt-0.5">Success</span>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Offer & Accepted conversion rate
                                </p>
                            </div>
                        </div>

                        {/* Quick stats items */}
                        <div className="space-y-3.5 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Active Funnel</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">{applied + interview} jobs</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Interviews Rate</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                    {total > 0 ? Math.round((interview / total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">Rejections Rate</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">
                                    {total > 0 ? Math.round((rejected / total) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/dashboard/jobs?add=true" className="group">
                    <Card className="h-full border border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70 transition-all cursor-pointer">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                <Plus className="h-4 w-4 text-zinc-600 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
                                Add Application
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-1">Log a new job posting details, links, and status.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/dashboard/profile">
                    <Card className="h-full border border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70 transition-all cursor-pointer">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                <User className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                Configure Profile
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-1">Update display details and upload your custom avatar profile.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/dashboard/settings">
                    <Card className="h-full border border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70 transition-all cursor-pointer">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                <ExternalLink className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                System Settings
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-1">Export metrics to JSON/Excel, switch configurations and variables.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
