import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth completion route.
 *
 * After the backend's `/api/v1/oauth/{provider}/cb` finishes the OAuth dance,
 * it redirects the browser to `/auth/oauth/callback?acc_token=...&refresh_token=...&role=...`.
 * The client page on that URL POSTs the tokens here so we can set the same
 * cookies the email/password login route sets (auth-token + user-role).
 *
 * Mirrors the cookie shape from /api/auth/login so the api-client and the
 * middleware both keep working unchanged.
 */

interface JwtPayload {
  user_id?: number | string
  role?: string
  email?: string
  name?: string
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Pulls full user profile from the Go backend using the freshly-issued access
// token. The OAuth JWT only carries `user_id` + `role`, so without this step
// the auth-store user has empty name/email after a Google/GitHub login.
//
// Adjust ME_ENDPOINT below if your backend exposes the current-user route
// at a different path.
const BACKEND_BASE = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(
  /\/+$/,
  '',
)
const ME_ENDPOINT = '/api/v1/auth/me'

async function fetchProfile(accToken: string): Promise<{
  id?: string | number
  email?: string
  name?: string
  role?: string
} | null> {
  if (!BACKEND_BASE) return null
  try {
    const res = await fetch(`${BACKEND_BASE}${ME_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${accToken}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    if (!body) return null
    // Accept common envelope shapes: { data: {...} }, { user: {...} }, or raw.
    return body.data ?? body.user ?? body
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { acc_token, refresh_token, role } = await request.json()

    if (!acc_token || typeof acc_token !== 'string') {
      return NextResponse.json({ message: 'Missing acc_token' }, { status: 400 })
    }

    const claims = decodeJwt(acc_token) ?? {}
    const profile = await fetchProfile(acc_token)

    const rawRole = (role || profile?.role || claims.role || 'guest') as string
    // Match the role-narrowing the email/password login store does — keeps the
    // middleware and any role-gated UI on the same vocabulary.
    const resolvedRole: 'admin' | 'guest' | 'customer' = rawRole === 'admin' ? 'admin' : 'guest'

    const user = {
      id: String(profile?.id ?? claims.user_id ?? ''),
      email: profile?.email ?? claims.email ?? '',
      name: profile?.name ?? claims.name ?? '',
      role: resolvedRole,
      createdAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ user, token: acc_token })

    response.cookies.set('user-role', resolvedRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    response.cookies.set('auth-token', acc_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    if (refresh_token && typeof refresh_token === 'string') {
      response.cookies.set('refresh-token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    console.error('OAuth completion error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
