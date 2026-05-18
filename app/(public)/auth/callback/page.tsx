import { Suspense } from 'react'
import { OAuthCallbackClient } from '@/components/auth/oauth-callback-client'

export const metadata = {
  title: 'Signing in… | Volt',
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackClient />
    </Suspense>
  )
}
