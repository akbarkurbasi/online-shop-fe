'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/store/auth'
import { validateLoginForm } from '@/lib/utils/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2 } from 'lucide-react'

function startOAuth(provider: 'google' | 'github') {
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
  // Same-tab redirect — the backend redirects back to /auth/callback which
  // finishes the sign-in and routes us home.
  window.location.href = `${base}/api/v1/oauth/${provider}/login`
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Optional returnTo — set by gated buttons (e.g., Add-to-Cart) so the user
  // lands back where they were after signing in. Only honored for same-origin paths.
  const returnTo = (() => {
    const raw = searchParams?.get('returnTo')
    if (!raw) return null
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : null
  })()
  const { login, isLoading, error: storeError, clearError } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null)
  const [oauthProvider, setOauthProvider] = useState<'google' | 'github' | null>(null)

  const handleOAuthClick = (provider: 'google' | 'github') => {
    setOauthProvider(provider)
    startOAuth(provider)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    clearError()

    const { valid, errors: validationErrors } = validateLoginForm(formData.email, formData.password)

    if (!valid) {
      setErrors(validationErrors)
      return
    }

    try {
      await login(formData.email, formData.password)
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' })
      
      const user = useAuth.getState().user
      if (user?.role === 'admin') {
        router.push('/admin')
      } else if (returnTo) {
        router.push(returnTo)
      } else {
        router.push('/')
      }
    } catch {
      setMessage(null)
    }
  }

  if (oauthProvider) {
    const label = oauthProvider === 'google' ? 'Google' : 'GitHub'
    return (
      <div className="text-center py-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Redirecting</p>
        <h2 className="text-3xl italic font-black uppercase tracking-tighter mb-4">One Moment</h2>
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Redirecting to {label}…
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Sign In</p>
      <h2 className="text-3xl italic font-black uppercase tracking-tighter mb-2">Welcome Back</h2>
      <p className="text-sm text-muted-foreground mb-8">Sign in to your Volt account</p>

      {/* Error Message */}
      {(storeError || message?.type === 'success') && (
        <div
          className={`mb-6 p-3 rounded-lg border flex gap-3 ${
            storeError
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">{storeError || message?.text}</p>
          </div>
        </div>
      )}

      {/* OAuth buttons — same-tab redirect to the backend's OAuth start URL. */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isLoading}
          onClick={() => handleOAuthClick('google')}
          className="rounded-md text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <GoogleIcon className="w-4 h-4 mr-2" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isLoading}
          onClick={() => handleOAuthClick('github')}
          className="rounded-md text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <GithubIcon className="w-4 h-4 mr-2" />
          GitHub
        </Button>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-card text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Or with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className={`rounded-md h-12 ${errors.email ? 'border-destructive' : ''}`}
          />
          {errors.email && <p className="text-destructive text-xs font-mono uppercase tracking-wider mt-2">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`rounded-md h-12 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showPassword ? '👁' : '👁‍🗨'}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs font-mono uppercase tracking-wider mt-2">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded-md" defaultChecked />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Remember me</span>
          </label>
          <Link href="#" className="text-[10px] font-mono uppercase tracking-[0.2em] hover:text-accent transition">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In →'
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-card text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">New customer?</span>
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]" size="lg" asChild>
        <Link href="/auth/register">Create Account</Link>
      </Button>
    </div>
  )
}
