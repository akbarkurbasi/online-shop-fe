/**
 * authService
 *
 * Semua request auth diarahkan ke Next.js API routes lokal (/api/auth/...)
 * bukan langsung ke backend eksternal. Hal ini memungkinkan middleware
 * membaca cookie `user-role` yang di-set oleh server-side API route.
 */

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'guest' | 'customer'
}

export interface AuthResponse {
  user: User
  token: string
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

export const authService = {
  /**
   * Login: POST /api/auth/login
   * Server akan mem-validasi credentials dan men-set cookie `user-role`.
   */
  login: (credentials: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  /**
   * Register: POST /api/auth/register
   * Server akan membuat user baru dan men-set cookie `user-role` = 'guest'.
   */
  register: (data: { email: string; password: string; name: string }) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Logout: POST /api/auth/logout
   * Server akan menghapus cookie `user-role` dan `auth-token`.
   */
  logout: () =>
    apiFetch<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  /**
   * Get profile: GET /api/auth/profile (opsional, jika dibutuhkan)
   */
  getProfile: () =>
    apiFetch<User>('/api/auth/profile', {
      method: 'GET',
    }),
}
