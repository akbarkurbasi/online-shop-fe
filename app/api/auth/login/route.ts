import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy POST untuk Login.
 * Mengirim email & password ke Backend API, lalu menyetel cookie `user-role`
 * agar middleware dapat membaca role user tanpa harus decode token.
 */

const API_URL = process.env.BACKEND_API_URL

// Dummy users untuk fallback ketika backend tidak tersedia
const DUMMY_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as const,
    password: 'password123',
  },
  {
    id: '2',
    email: 'customer@example.com',
    name: 'Customer User',
    role: 'customer' as const,
    password: 'password123',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    let user: { id: string; email: string; name: string; role: string } | null = null
    let token: string | null = null

    // Coba hubungi backend jika API_URL dikonfigurasi
    if (API_URL) {
      try {
        const backendRes = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (backendRes.ok) {
          const data = await backendRes.json()

          user = data.data.user
          token = data.data.token
        } else {
          const err = await backendRes.json().catch(() => ({}))
          return NextResponse.json(
            { message: err.message || 'Invalid email or password' },
            { status: backendRes.status }
          )
        }
      } catch (fetchError) {
        console.warn('Backend tidak dapat dijangkau, menggunakan dummy users:', fetchError)
      }
    }

    // Fallback: validasi menggunakan dummy users
    if (!user) {
      const found = DUMMY_USERS.find(
        (u) => u.email === email && u.password === password
      )
      if (!found) {
        return NextResponse.json(
          { message: 'Email atau password salah' },
          { status: 401 }
        )
      }
      const { password: _pw, ...safeUser } = found
      user = safeUser
      token = `dummy-token-${safeUser.id}-${Date.now()}`
    }

    const response = NextResponse.json({ user, token })

    // httpOnly: true — hanya dibaca oleh Next.js middleware, tidak oleh JS browser
    response.cookies.set('user-role', user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    })

    // httpOnly: false — JS browser perlu membaca token ini untuk dikirim
    // sebagai Authorization: Bearer ke backend Go (localhost:8000)
    if (token) {
      response.cookies.set('auth-token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      })
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
