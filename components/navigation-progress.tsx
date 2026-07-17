'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgress() {
    const pathname = usePathname()
    const [progress, setProgress] = useState(0)
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const prevPathname = useRef(pathname)

    const clear = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    const start = () => {
        clear()
        setProgress(0)
        setVisible(true)

        let p = 0
        intervalRef.current = setInterval(() => {
            // Incrementally grow toward 90 %, slowing as it approaches
            p += Math.random() * 15 * (1 - p / 90)
            if (p > 88) p = 88
            setProgress(p)
        }, 150)
    }

    const finish = () => {
        clear()
        setProgress(100)
        timerRef.current = setTimeout(() => {
            setVisible(false)
            setProgress(0)
        }, 400)
    }

    useEffect(() => {
        if (pathname !== prevPathname.current) {
            prevPathname.current = pathname
            finish()
        }
    }, [pathname])

    // On first mount & when navigating FROM current page trigger start
    // We detect navigation start via a click on any <a> tag
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a')
            if (!target) return
            const href = target.getAttribute('href')
            // Only trigger for internal links that change the path
            if (
                href &&
                !href.startsWith('http') &&
                !href.startsWith('mailto') &&
                !href.startsWith('#') &&
                href !== pathname
            ) {
                start()
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    if (!visible && progress === 0) return null

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
            aria-hidden="true"
        >
            <div
                className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.7)] transition-all"
                style={{
                    width: `${progress}%`,
                    transitionDuration: progress === 100 ? '200ms' : '150ms',
                    transitionTimingFunction: 'ease-out',
                    opacity: visible ? 1 : 0,
                }}
            />
        </div>
    )
}
