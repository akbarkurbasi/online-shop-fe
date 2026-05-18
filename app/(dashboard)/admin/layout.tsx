'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LogOut,
  Bell,
  Search,
  LayoutDashboard,
  Box,
  Newspaper,
  Users,
  CreditCard,
  Plus,
  Tag,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useAuth } from '@/lib/store/auth'

const QUICK_ADD = [
  { href: '/admin/products/new', label: 'New Product', icon: Box },
  { href: '/admin/articles/new', label: 'New Article', icon: Newspaper },
  { href: '/admin/products?tab=categories', label: 'New Category', icon: Tag },
  { href: '/admin/users', label: 'New Customer', icon: Users },
]

type NavItem = {
  href: string
  icon: typeof LayoutDashboard
  label: string
  index: string
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Overview',
    index: '01',
    match: (p) => p === '/admin',
  },
  {
    href: '/admin/products',
    icon: Box,
    label: 'Products',
    index: '02',
    match: (p) => p.startsWith('/admin/products'),
  },
  {
    href: '/admin/articles',
    icon: Newspaper,
    label: 'Articles',
    index: '03',
    match: (p) => p.startsWith('/admin/articles'),
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'Customers',
    index: '04',
    match: (p) => p.startsWith('/admin/users'),
  },
  {
    href: '/admin/orders',
    icon: CreditCard,
    label: 'Orders',
    index: '05',
    match: (p) => p.startsWith('/admin/orders'),
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const quickAddRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setIsQuickAddOpen(false)
      }
    }
    if (isQuickAddOpen) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [isQuickAddOpen])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')
    : 'VL'

  const activeItem = NAV_ITEMS.find((item) => item.match(pathname))

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-background z-50">
        {/* Brand */}
        <div className="px-6 py-8 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <span
              className="h-2.5 w-2.5 bg-accent rounded-sm shrink-0 group-hover:bg-foreground transition-colors"
              aria-hidden="true"
            />
            <span className="text-2xl italic font-black uppercase tracking-tighter group-hover:text-accent transition-colors">
              Volt
            </span>
            <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
            / Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 pl-5 pr-4 py-3 rounded-md transition-colors',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                {/* Left hairline indicator */}
                <span
                  className={cn(
                    'absolute left-0 top-2 bottom-2 w-0.5 bg-accent transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[10px] font-mono uppercase tracking-[0.3em] shrink-0',
                    isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-accent transition-colors'
                  )}
                >
                  {item.index}
                </span>
                <span className="text-muted-foreground">/</span>
                <item.icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                  strokeWidth={1.75}
                />
                <span
                  className={cn(
                    'text-[11px] font-mono uppercase tracking-[0.2em] transition-colors',
                    isActive ? 'text-foreground font-bold' : 'group-hover:text-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer: profile + logout */}
        <div className="px-4 py-5 border-t border-border space-y-3">
          <div className="flex items-center gap-3 p-3 border border-border rounded-md">
            <div className="w-9 h-9 border border-foreground flex items-center justify-center text-[10px] font-mono uppercase tracking-tight rounded-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-tight truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-11 rounded-md justify-center text-[11px] font-mono uppercase tracking-[0.3em] hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 lg:px-10 shrink-0 z-40">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            <span>/ Admin</span>
            <span>·</span>
            <span className="text-foreground">{activeItem?.label || 'Overview'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, orders, customers…"
                className="h-10 w-72 pl-9 pr-3 bg-secondary border border-transparent focus:border-foreground rounded-md text-xs font-mono tracking-tight placeholder:text-muted-foreground focus:outline-none transition-colors"
              />
            </div>

            {/* Quick Add menu */}
            <div className="relative" ref={quickAddRef}>
              <button
                onClick={() => setIsQuickAddOpen((v) => !v)}
                className={cn(
                  'h-10 flex items-center gap-2 px-3 border transition-colors rounded-md text-[11px] font-mono uppercase tracking-[0.2em]',
                  isQuickAddOpen
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-foreground hover:bg-foreground hover:text-background'
                )}
                aria-label="Quick add"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quick Add</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', isQuickAddOpen && 'rotate-180')} />
              </button>
              {isQuickAddOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-background border border-foreground z-50 rounded-md overflow-hidden">
                  <p className="px-4 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground border-b border-border">
                    / Create New
                  </p>
                  {QUICK_ADD.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsQuickAddOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors border-b border-border last:border-b-0"
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </span>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              className="relative h-10 w-10 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-colors rounded-md"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 h-10 pl-1.5 pr-3 border border-transparent hover:border-foreground transition-colors rounded-md"
              title="Sign out"
            >
              <div className="w-8 h-8 border border-foreground flex items-center justify-center text-[10px] font-mono uppercase tracking-tight rounded-sm">
                {initials}
              </div>
              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-secondary/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
