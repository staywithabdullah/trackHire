'use client'

import { useMemo } from 'react'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, Legend
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { TrendingUp, Target, Activity, BarChart2 } from 'lucide-react'

interface Job {
    id: string
    status: string
    priority: string | null
    employment_type: string | null
    date_applied: string
    created_at: string
}

interface AnalyticsDashboardProps {
    jobs: Job[]
}

// Status colour palette
const STATUS_COLORS: Record<string, string> = {
    'Applied': '#3b82f6',
    'Assessment': '#f59e0b',
    'HR Interview': '#a855f7',
    'Technical Interview': '#7c3aed',
    'Final Interview': '#6366f1',
    'Offer Received': '#10b981',
    'Accepted': '#22c55e',
    'Rejected': '#ef4444',
}

const PRIORITY_COLORS: Record<string, string> = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#22c55e',
}

// Custom Tooltip for pie
const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-lg text-xs">
                <p className="font-bold text-zinc-900 dark:text-white">{payload[0].name}</p>
                <p className="text-zinc-500 mt-0.5">{payload[0].value} applications</p>
            </div>
        )
    }
    return null
}

// Custom Tooltip for bar/area
const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 shadow-lg text-xs">
                <p className="font-bold text-zinc-900 dark:text-white mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.dataKey} className="text-zinc-500" style={{ color: p.color }}>
                        {p.name}: <span className="font-semibold">{p.value}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function AnalyticsDashboard({ jobs }: AnalyticsDashboardProps) {
    const total = jobs.length

    // ── Status Distribution for Pie ──────────────────────────────────────────
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {}
        jobs.forEach(j => {
            counts[j.status] = (counts[j.status] || 0) + 1
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [jobs])

    // ── Monthly Applications – Area / Bar ────────────────────────────────────
    const monthlyData = useMemo(() => {
        const map: Record<string, { month: string; Applied: number; Interviews: number; Offers: number }> = {}

        jobs.forEach(j => {
            const d = new Date(j.date_applied)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            if (!map[key]) map[key] = { month: label, Applied: 0, Interviews: 0, Offers: 0 }

            if (j.status === 'Applied') map[key].Applied++
            else if (['HR Interview', 'Technical Interview', 'Final Interview', 'Assessment'].includes(j.status)) map[key].Interviews++
            else if (['Offer Received', 'Accepted'].includes(j.status)) map[key].Offers++
        })

        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v)
    }, [jobs])

    // ── Priority Breakdown ────────────────────────────────────────────────────
    const priorityData = useMemo(() => {
        const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0 }
        jobs.forEach(j => {
            if (j.priority && counts[j.priority] !== undefined) counts[j.priority]++
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [jobs])

    // ── Funnel Stages ─────────────────────────────────────────────────────────
    const funnelData = useMemo(() => {
        const applied = jobs.length
        const assessment = jobs.filter(j => ['Assessment', 'HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted'].includes(j.status)).length
        const interviews = jobs.filter(j => ['HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted'].includes(j.status)).length
        const offers = jobs.filter(j => ['Offer Received', 'Accepted'].includes(j.status)).length
        const accepted = jobs.filter(j => j.status === 'Accepted').length

        return [
            { stage: 'Applied', count: applied },
            { stage: 'Assessment', count: assessment },
            { stage: 'Interviewing', count: interviews },
            { stage: 'Offer', count: offers },
            { stage: 'Accepted', count: accepted },
        ]
    }, [jobs])

    // ── Key stat ──────────────────────────────────────────────────────────────
    const interviewRate = total > 0
        ? Math.round((jobs.filter(j => ['HR Interview', 'Technical Interview', 'Final Interview', 'Offer Received', 'Accepted'].includes(j.status)).length / total) * 100)
        : 0

    const offerRate = total > 0
        ? Math.round((jobs.filter(j => ['Offer Received', 'Accepted'].includes(j.status)).length / total) * 100)
        : 0

    const rejectionRate = total > 0
        ? Math.round((jobs.filter(j => j.status === 'Rejected').length / total) * 100)
        : 0

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <BarChart2 className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No data to visualize yet</p>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs">Add job applications in the Job Tracker to unlock analytics charts.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {/* ── Top KPI Cards ───────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Apps', value: total, icon: <Activity className="h-4 w-4 text-zinc-400" />, color: '' },
                    { label: 'Interview Rate', value: `${interviewRate}%`, icon: <Target className="h-4 w-4 text-purple-400" />, color: 'text-purple-600 dark:text-purple-400' },
                    { label: 'Offer Rate', value: `${offerRate}%`, icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Rejection Rate', value: `${rejectionRate}%`, icon: <Target className="h-4 w-4 text-rose-400" />, color: 'text-rose-600 dark:text-rose-400' },
                ].map(kpi => (
                    <Card key={kpi.label} className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{kpi.label}</CardTitle>
                            {kpi.icon}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${kpi.color || 'text-zinc-900 dark:text-white'}`}>{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Row 1: Status Pie + Monthly Area ────────── */}
            <div className="grid gap-6 md:grid-cols-5">

                {/* Status Donut */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Status Breakdown</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Distribution across all stages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={STATUS_COLORS[entry.name] || '#71717a'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                            {statusData.map(s => (
                                <div key={s.name} className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.name] || '#71717a' }} />
                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">{s.name}</span>
                                    <span className="text-[10px] font-bold text-zinc-900 dark:text-white ml-auto">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Area Chart */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Activity Over Time</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">Monthly applications by stage outcome</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyData.length < 2 ? (
                            <div className="flex items-center justify-center h-[220px] text-xs text-zinc-500">Add more applications across different months to see trends.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                                    <defs>
                                        <linearGradient id="gApplied" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gInterviews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gOffers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717a' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                    <Area type="monotone" dataKey="Applied" stroke="#3b82f6" fill="url(#gApplied)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="Interviews" stroke="#a855f7" fill="url(#gInterviews)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="Offers" stroke="#10b981" fill="url(#gOffers)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 2: Funnel Bar + Priority Pie ────────── */}
            <div className="grid gap-6 md:grid-cols-5">

                {/* Application Funnel (descending bars) */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Application Funnel</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">How many applications progress through each stage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={funnelData} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
                                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#71717a' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]}>
                                    {funnelData.map((_, i) => (
                                        <Cell key={`f-${i}`} fill={['#3b82f6', '#f59e0b', '#a855f7', '#10b981', '#22c55e'][i] || '#71717a'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Priority Donut */}
                <Card className="border border-zinc-200/80 bg-white/50 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-900/50 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Priority Distribution</CardTitle>
                        <CardDescription className="text-xs text-zinc-500">High / Medium / Low priority mix</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={72}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, i) => (
                                        <Cell key={`pc-${i}`} fill={PRIORITY_COLORS[entry.name] || '#71717a'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-1">
                            {priorityData.map(p => (
                                <div key={p.name} className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p.name] || '#71717a' }} />
                                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400">{p.name}</span>
                                    <span className="text-[10px] font-bold text-zinc-900 dark:text-white">{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
