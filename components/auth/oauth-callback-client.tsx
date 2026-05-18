'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth, type User } from '@/lib/store/auth'

type Status = 'pending' | 'error'

export function OAuthCallbackClient() {
  const searchParams = useSearchParams()
  const ranRef = useRef(false)
  const [status, setStatus] = useState<Status>('pending')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Strict-mode-safe single-run guard. The token would otherwise be POSTed
    // twice in dev, which is harmless but wasteful.
    if (ranRef.current) return
    ranRef.current = true

    // Accept either `token` (current backend) or `acc_token` (earlier naming)
    // so this page is tolerant of whichever the backend ends up sending.
    const accToken = searchParams?.get('token') ?? searchParams?.get('acc_token')
    const refreshToken = searchParams?.get('refresh_token')
    const role = searchParams?.get('role')
    const errParam = searchParams?.get('error')

    if (errParam) {
      setStatus('error')
      setError(decodeURIComponent(errParam))
      return
    }

    if (!accToken) {
      setStatus('error')
      setError('Missing access token in callback URL.')
      return
    }

    const finish = async () => {
      try {
        const res = await fetch('/api/auth/oauth/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acc_token: accToken,
            refresh_token: refreshToken,
            role,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `Sign-in failed (${res.status})`)
        }
        const { user } = (await res.json()) as { user: User }

        useAuth.setState({ user, isLoading: false, error: null })

        // Hydrate the cart from the backend for the signed-in user.
        try {
          const { useCart } = await import('@/lib/store/cart')
          await useCart.getState().fetchCart()
        } catch {
          // non-fatal — cart will sync on the next page
        }

        const target = user.role === 'admin' ? '/admin' : '/'
        // Use a full navigation so any server components re-fetch with the
        // freshly-set auth cookies — router.replace alone can leave a stale
        // RSC payload that "freezes" the UI on the callback page.
        window.location.replace(target)
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Sign-in failed.')
      }
    }

    finish()
  }, [searchParams])

  if (status === 'error') {
    return (
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Sign-in failed</p>
        <h2 className="text-3xl italic font-black uppercase tracking-tighter mb-3">Couldn&apos;t complete sign-in</h2>
        <div className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive flex gap-3 text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] leading-relaxed">{error}</p>
        </div>
        <Button asChild className="w-full rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]">
          <Link href="/auth/login">Back to Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Signing You In</p>
      <h2 className="text-3xl italic font-black uppercase tracking-tighter mb-4">One Moment</h2>
      <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verifying credentials
      </div>
    </div>
  )
}
