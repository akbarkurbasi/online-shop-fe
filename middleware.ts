import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define protected routes
    const isAdminRoute = pathname.startsWith('/admin')
    const isAdminApiRoute = pathname.startsWith('/api/admin')

    if (isAdminRoute || isAdminApiRoute) {
        const userRole = request.cookies.get('user-role')?.value

        if (userRole !== 'admin') {
            // If it's an API route, return 403 Forbidden
            if (isAdminApiRoute) {
                return new NextResponse(
                    JSON.stringify({ error: 'Forbidden: Admin access required' }),
                    { status: 403, headers: { 'content-type': 'application/json' } }
                )
            }

            // If it's a page route, redirect to login
            const url = new URL('/auth/login', request.url)
            // Optional: add a redirect parameter to return after login
            url.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
    ],
}