import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy POST untuk Register.
 * Mengirim data ke Backend API atau dummy handler, lalu set cookie user-role.
 */

const API_URL = process.env.BACKEND_API_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Coba hubungi backend jika API_URL dikonfigurasi
    if (API_URL) {
      try {
        const backendRes = await fetch(`${API_URL}/api/v1/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        if (backendRes.ok) {
          const data = await backendRes.json()
          const response = NextResponse.json(data.data, { status: 201 })

          // Set cookie user-role (user baru selalu 'customer')
          response.cookies.set('user-role', data.data?.user?.role || 'customer', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          })

          if (data.data?.token) {
            response.cookies.set('auth-token', data.data.token, {
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 7,
            })
          }

          return response
        } else {
          const err = await backendRes.json().catch(() => ({}))
          return NextResponse.json(
            { message: err.message || 'Registration failed' },
            { status: backendRes.status }
          )
        }
      } catch (fetchError) {
        console.warn('Backend tidak dapat dijangkau:', fetchError)
      }
    }

    // Fallback dummy: simulasikan user baru terbuat
    const newUser = {
      id: `dummy-${Date.now()}`,
      email,
      name,
      role: 'customer',
    }
    const token = `dummy-token-${newUser.id}`

    const response = NextResponse.json({ user: newUser, token }, { status: 201 })

    response.cookies.set('user-role', 'customer', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
