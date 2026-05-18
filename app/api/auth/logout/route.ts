import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Menghapus cookie `user-role` dan `auth-token` agar middleware
 * tidak lagi menganggap user sebagai admin.
 */

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' })

    // Hapus semua cookie yang terkait autentikasi
    response.cookies.set('user-role', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Langsung expired
    })

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
