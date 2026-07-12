import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isAuthRoute = path.startsWith('/auth')
    const isDashboardRoute = path.startsWith('/dashboard')

    // Check authentication
    if (!user) {
        // If not authenticated and trying to access dashboard (or root), redirect to login
        if (isDashboardRoute || path === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
    } else {
        // User is authenticated
        const emailConfirmed = user.email_confirmed_at

        // If email is not confirmed, redirect to verify-email (except if they are signing out or already there)
        if (!emailConfirmed && path !== '/auth/verify-email' && path !== '/auth/logout' && !path.startsWith('/auth/verify-email')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/verify-email'
            return NextResponse.redirect(url)
        }

        // If email is confirmed and they are trying to access auth pages (login, signup, verify-email), redirect to dashboard
        if (isAuthRoute && path !== '/auth/logout') {
            if (emailConfirmed || path === '/auth/verify-email') {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        }

        // If root page, redirect to dashboard
        if (path === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
