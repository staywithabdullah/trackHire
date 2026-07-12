'use client'

import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

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
    jobs: Job[]
    user: any
}

export default function SettingsPanel({ jobs, user }: SettingsPanelProps) {
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

            const headers = ['job_title', 'company_name', 'status', 'priority', 'location', 'date_applied', 'created_at', 'notes']
            const rows = jobs.map((job) => {
                return headers.map((header) => {
                    const val = job[header as keyof Job] || ''
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
        <div className="grid gap-6 md:grid-cols-2">
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
    )
}
