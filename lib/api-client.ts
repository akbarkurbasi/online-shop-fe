/**
 * api-client.ts
 *
 * Semua request data langsung hit backend Go di BASE_URL (localhost:8000).
 * TIDAK ada proxy Next.js — ini murni frontend.
 *
 * PENGECUALIAN: auth (login/logout/register) tetap lewat Next.js API routes
 * karena perlu set cookie `user-role` di domain yang sama agar middleware bisa baca.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  publicApiClient  — endpoint tanpa autentikasi                          │
 * │    GET /products, GET /articles, GET /products/:id, dll                 │
 * │                                                                         │
 * │  privateApiClient — endpoint butuh token (admin / user login)           │
 * │    POST/PUT/DELETE /admin/products, GET /orders, dll                    │
 * │    Otomatis menyertakan Authorization: Bearer <token>                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

type RequestConfig = RequestInit & {
  params?: Record<string, string | number>
}

// ─── Helper: build URL dengan query params ─────────────────────────────────

function buildUrl(endpoint: string, params?: Record<string, string | number>): string {
  // Pastikan BASE_URL tidak berakhiran / dan endpoint diawali dengan /
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  const url = new URL(`${baseUrl}${cleanEndpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString())
    })
  }
  return url.toString()
}

// ─── Helper: baca cookie dari document ────────────────────────────────────
// auth-token disimpan sebagai cookie biasa (bukan httpOnly) supaya bisa
// dibaca JS dan dikirim ke backend Go via Authorization header.

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(^| )auth-token=([^;]+)/)
  return match ? decodeURIComponent(match[2]) : null
}

// ─── Core fetch ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  config: RequestConfig = {},
  withAuth = false
): Promise<T> {
  const { params, headers: customHeaders, ...init } = config

  const url = buildUrl(endpoint, params)

  const authHeaders: HeadersInit = {}
  if (withAuth) {
    const token = getAuthToken()
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    const isFormData = init.body instanceof FormData
    response = await fetch(url, {
      ...init,
      headers: {
        // ngrok free-tier serves an HTML interstitial on the first browser hit
        // to a tunnel; this header tells ngrok to skip it and forward through.
        // No-op on non-ngrok backends.
        'ngrok-skip-browser-warning': 'true',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...authHeaders,
        ...customHeaders,
      },
    })
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error)
    throw new Error(`Failed to connect to API at ${url}. Is the backend running?`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    if (withAuth && response.status === 401) {
      // Token expired / tidak valid — hapus state auth (zustand persisted) supaya
      // CartSync di root layout tidak terus-menerus memicu fetchCart → 401 → redirect loop.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-store')
        localStorage.removeItem('cart-store')
        window.location.href = '/auth/login'
      }
    }

    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}

// ─── PUBLIC API CLIENT ────────────────────────────────────────────────────
// Endpoint yang bisa diakses tanpa login.
// Langsung hit backend Go di localhost:8000.

export const publicApiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'GET' }, false),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }, false),
}

// ─── PRIVATE API CLIENT ───────────────────────────────────────────────────
// Endpoint yang butuh autentikasi.
// Otomatis attach Authorization: Bearer <token> ke setiap request.
// Langsung hit backend Go di localhost:8000.

export const privateApiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'GET' }, true),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }, true),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }, true),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }, true),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiFetch<T>(endpoint, { ...config, method: 'DELETE' }, true),
}

/** @deprecated Gunakan publicApiClient atau privateApiClient */
export const apiClient = publicApiClient
