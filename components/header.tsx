'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { useUI } from '@/lib/store/ui'
import { useAuth } from '@/lib/store/auth'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CartDrawer } from '@/components/cart-drawer'

type NavLink = {
  href: string
  label: string
  index: string
  match: (pathname: string) => boolean
  guestOnly?: boolean
}

const NAV_LINKS: NavLink[] = [
  {
    href: '/shop',
    label: 'Shop',
    index: '01',
    match: (p) => p === '/shop' || p.startsWith('/shop/') || p.startsWith('/products/'),
  },
  {
    href: '/blog',
    label: 'Journal',
    index: '02',
    match: (p) => p === '/blog' || p.startsWith('/blog/'),
  },
  {
    href: '/about',
    label: 'About',
    index: '03',
    match: (p) => p === '/about',
  },
  {
    href: '/contact',
    label: 'Contact',
    index: '04',
    match: (p) => p === '/contact',
  },
  {
    href: '/account/orders',
    label: 'Orders',
    index: '05',
    match: (p) => p.startsWith('/account/orders'),
    guestOnly: true,
  },
]

export function Header() {
  const { items } = useCart()
  const { isMobileMenuOpen, toggleMobileMenu, toggleCart } = useUI()
  const { user, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname() ?? '/'
  // Count of distinct line items in the cart — matches the
  // `/ Bag · N pieces` count shown in the cart drawer header.
  const totalItems = items.length

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')
    : ''

  const visibleLinks = NAV_LINKS.filter(l => !l.guestOnly || user?.role === 'guest')

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      {/* Top ticker */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 border-b border-border bg-foreground text-background">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">/ FW 26 — Drop 02</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Free Shipping Over $150</span>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">30-Day Returns</span>
      </div>

      {/* Main bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-6 h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="h-2.5 w-2.5 bg-accent rounded-sm shrink-0 group-hover:bg-foreground transition-colors" aria-hidden="true" />
            <span className="text-2xl md:text-3xl italic font-black uppercase tracking-tighter group-hover:text-accent transition-colors">Volt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {visibleLinks.map((link) => {
              const active = link.match(pathname)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] py-1"
                >
                  <span className={cn(
                    'transition-colors',
                    active ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
                  )}>
                    {link.index}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className={cn(
                    'transition-colors',
                    active ? 'text-foreground font-bold' : 'text-foreground group-hover:text-accent'
                  )}>
                    {link.label}
                  </span>
                  <span className={cn(
                    'absolute left-0 right-0 -bottom-0.5 h-px bg-foreground origin-left transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="h-10 w-10 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Cart */}
            <button
              onClick={() => toggleCart()}
              data-cart-target
              className="relative h-10 px-3 flex items-center gap-2 border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] hidden sm:inline">Bag</span>
              {totalItems > 0 && (
                <span className="text-[10px] font-mono tracking-tight ml-0.5 px-1.5 py-0.5 bg-accent text-accent-foreground">
                  {String(totalItems).padStart(2, '0')}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative hidden md:block">
              {user ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`h-10 flex items-center gap-2 pl-1 pr-3 border transition-colors ${
                      isUserMenuOpen
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-transparent hover:border-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 border flex items-center justify-center text-[10px] font-mono uppercase tracking-tight ${
                      isUserMenuOpen ? 'border-background' : 'border-foreground'
                    }`}>
                      {initials || 'VL'}
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] hidden lg:inline max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-background border border-foreground z-50">
                      <div className="p-4 border-b border-border">
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Signed In</p>
                        <p className="text-sm font-bold tracking-tight truncate">{user.name}</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center justify-between px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2.5">
                          <User className="w-3.5 h-3.5" />
                          My Account
                        </span>
                        <span>→</span>
                      </Link>
                      {user.role === 'admin' ? (
                        <Link
                          href="/admin"
                          className="flex items-center justify-between px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition-colors border-t border-border"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2.5">
                            <Settings className="w-3.5 h-3.5" />
                            Admin Dashboard
                          </span>
                          <span>→</span>
                        </Link>
                      ) : (
                        <Link
                          href="/account/orders"
                          className="flex items-center justify-between px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition-colors border-t border-border"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5" />
                            My Orders
                          </span>
                          <span>→</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors border-t border-border text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="rounded-md h-10 px-4 text-[10px] font-mono uppercase tracking-[0.2em]">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="rounded-md h-10 px-4 text-[10px] font-mono uppercase tracking-[0.2em]">
                    <Link href="/auth/register">Sign Up →</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => toggleMobileMenu()}
              className="md:hidden h-10 w-10 flex items-center justify-center border border-transparent hover:border-foreground hover:bg-foreground hover:text-background transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t border-border pt-4 pb-5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground shrink-0">/ Search</span>
              <input
                type="text"
                placeholder="Search products, collections, drops..."
                className="flex-1 px-0 py-2 bg-transparent border-b border-foreground rounded-md focus:outline-none text-sm font-medium tracking-tight placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden flex flex-col border-t border-border pt-6 pb-8 overflow-y-auto max-h-[calc(100vh-120px)]">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">/ Menu</p>
            <div className="flex flex-col">
              {visibleLinks.map((link) => {
                const active = link.match(pathname)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between py-4 border-b border-border group"
                    onClick={() => toggleMobileMenu()}
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className={cn(
                        'text-[10px] font-mono uppercase tracking-[0.3em] transition-colors',
                        active ? 'text-accent' : 'text-muted-foreground'
                      )}>
                        / {link.index}
                      </span>
                      <span className={cn(
                        'text-2xl italic font-black uppercase tracking-tighter transition-colors',
                        active ? 'text-foreground' : 'text-foreground group-hover:text-accent'
                      )}>
                        {link.label}
                      </span>
                    </div>
                    <span className={cn(
                      'text-lg transition-colors',
                      active ? 'text-accent' : 'text-foreground group-hover:text-accent'
                    )}>
                      →
                    </span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile Auth Section */}
            <div className="mt-8">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">/ Account</p>
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                    <div className="w-10 h-10 border border-foreground flex items-center justify-center text-[11px] font-mono uppercase tracking-tight">
                      {initials || 'VL'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold uppercase tracking-tight truncate">{user.name}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center justify-between py-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition-colors"
                    onClick={() => toggleMobileMenu()}
                  >
                    My Account <span>→</span>
                  </Link>
                  {user.role === 'admin' ? (
                    <Link
                      href="/admin"
                      className="flex items-center justify-between py-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition-colors"
                      onClick={() => toggleMobileMenu()}
                    >
                      Admin Dashboard <span>→</span>
                    </Link>
                  ) : (
                    <Link
                      href="/account/orders"
                      className="flex items-center justify-between py-3 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition-colors"
                      onClick={() => toggleMobileMenu()}
                    >
                      My Orders <span>→</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout()
                      toggleMobileMenu()
                    }}
                    className="w-full flex items-center justify-between py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-destructive hover:opacity-70 transition-opacity text-left"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </span>
                    <span>→</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" asChild className="w-full rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]" onClick={() => toggleMobileMenu()}>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="w-full rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]" onClick={() => toggleMobileMenu()}>
                    <Link href="/auth/register">Sign Up →</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
      <CartDrawer />
    </header>
  )
}
