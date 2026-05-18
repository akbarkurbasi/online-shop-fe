import { Suspense } from 'react'
import { LoginClient } from '@/components/auth/login-client'

export const metadata = {
  title: 'Login | Volt',
  description: 'Sign in to your Volt account to manage your orders and profile.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  )
}
