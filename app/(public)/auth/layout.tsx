import { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
            <span className="h-3 w-3 bg-accent rounded-sm shrink-0 group-hover:bg-foreground transition-colors" aria-hidden="true" />
            <span className="text-4xl italic font-black uppercase tracking-tighter group-hover:text-accent transition-colors">Volt</span>
          </Link>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Sportswear · Lifestyle · Performance</p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-card border border-border p-8">
          {children}
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Secure Checkout &middot;{' '}
            <Link href="/about" className="hover:text-accent transition">
              About us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
