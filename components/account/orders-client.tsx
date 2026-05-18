'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Receipt,
  Coins,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/lib/store/auth'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatPrice, cn } from '@/lib/utils'
import { STATUS_STYLES, STATUS_FALLBACK_STYLE } from '@/lib/order-status'
import { orderService } from '@/services/orderService'
import type { Order } from '@/lib/types'

type StatusFilter = 'all' | Order['status']
type SortKey = 'newest' | 'oldest'

const STATUS_OPTIONS: StatusFilter[] = [
  'all',
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
]


const PER_PAGE_OPTIONS = [5, 10, 20, 50]

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

export function OrdersClient() {
  const router = useRouter()
  const { user, hasHydrated } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(true)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState<number>(10)

  // Reset to page 1 whenever filters change (matches product-list pattern)
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortKey, perPage])

  const fetchOrders = async () => {
    try {
      const data = await orderService.myOrders()
      setOrders(data.data.items || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    // Wait for Zustand persist to rehydrate from localStorage before deciding —
    // otherwise the initial `user = null` triggers a redirect on every refresh.
    if (!hasHydrated) return
    if (!user) {
      router.push('/auth/login')
    } else {
      setIsLoading(false)
      fetchOrders()
    }
  }, [user, hasHydrated, router])

  // ── Derived: stats, filter counts, sorted + paginated list ────────────────
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length
    const completed = orders.filter(
      (o) => o.status === 'delivered' || o.status === 'paid',
    ).length
    const spent = orders
      .filter((o) => o.status === 'delivered' || o.status === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    return { total: orders.length, pending, completed, spent }
  }, [orders])

  const filterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: orders.length,
      pending: 0,
      paid: 0,
      failed: 0,
      expired: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }
    for (const o of orders) {
      counts[o.status as StatusFilter] = (counts[o.status as StatusFilter] || 0) + 1
    }
    return counts
  }, [orders])

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? [...orders] : orders.filter((o) => o.status === statusFilter)
    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sortKey === 'newest' ? tb - ta : ta - tb
    })
    return list
  }, [orders, statusFilter, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  // ── Auth-loading guard ────────────────────────────────────────────────────
  if (!hasHydrated || isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm bg-accent animate-pulse" />
            Authenticating…
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
                / Account · 02 — Orders
              </p>
              <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">
                Order History
              </h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-md">
                All your past and pending orders in one place.
              </p>
            </div>
            <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
              <Link href="/shop">Continue Shopping →</Link>
            </Button>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile index="01" label="Total Orders" value={String(stats.total)} icon={Receipt} />
            <StatTile index="02" label="Pending" value={String(stats.pending)} icon={Clock} accent={stats.pending > 0} />
            <StatTile index="03" label="Completed" value={String(stats.completed)} icon={CheckCircle2} />
            <StatTile index="04" label="Total Spent" value={formatPrice(stats.spent)} icon={Coins} accent />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-4 pb-6 border-b border-border lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 border border-border rounded-md p-0.5 bg-background self-start max-w-full overflow-x-auto">
              {STATUS_OPTIONS.map((s) => {
                const active = statusFilter === s
                const count = filterCounts[s] ?? 0
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'h-9 px-3 text-[10px] font-mono uppercase tracking-[0.2em] rounded-sm transition-colors whitespace-nowrap',
                      active
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {s === 'all' ? 'All' : s} · {count}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-9 w-[160px] rounded-md text-[10px] font-mono uppercase tracking-[0.2em]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                    Newest First
                  </SelectItem>
                  <SelectItem value="oldest" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                    Oldest First
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          {isFetching ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-md" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                label="/ Empty"
                heading="No Orders Yet"
                body="Place an order from the shop to see it here."
                action={
                  <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
                    <Link href="/shop">
                      <ShoppingBag className="h-3.5 w-3.5 mr-2" />
                      Browse Shop
                    </Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                label="/ No Match"
                heading="Nothing Matches"
                body="Try a different status filter."
                action={
                  <Button
                    variant="outline"
                    onClick={() => setStatusFilter('all')}
                    className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
                  >
                    Clear Filters →
                  </Button>
                }
              />
            )
          ) : (
            <div className="space-y-3">
              {paginated.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          {/* Pagination footer */}
          {!isFetching && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
              </p>

              <div className="flex items-center gap-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hidden sm:inline">
                  Per page
                </p>
                <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                  <SelectTrigger className="h-9 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="h-9 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.3em]"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Prev
                </Button>
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="h-9 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.3em]"
                >
                  Next
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ────────────────────────────────────────────────────────────────────────────

function StatTile({
  index,
  label,
  value,
  icon: Icon,
  accent,
}: {
  index: string
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'border border-border rounded-md p-5 bg-background relative overflow-hidden transition-colors hover:border-foreground',
        accent && 'border-accent/40',
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          / {index}
        </p>
        <Icon
          className={cn('h-3.5 w-3.5 text-muted-foreground', accent && 'text-accent')}
          strokeWidth={1.75}
        />
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-2xl md:text-3xl italic font-black tracking-tighter break-all">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
        STATUS_STYLES[status] || STATUS_FALLBACK_STYLE,
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {status}
    </span>
  )
}

function OrderCard({ order }: { order: Order }) {
  const items = order.items || []
  const visible = items.slice(0, 4)
  const overflow = items.length - visible.length
  const showPayCTA = order.status === 'pending' && !!order.payment_url

  return (
    <div className="border border-border rounded-md p-6 bg-background hover:border-foreground transition-colors">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="text-sm font-black uppercase tracking-tight text-foreground">
            #{order.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-foreground/80">
            {formatDateShort(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Middle row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 py-5">
        {/* Items */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex -space-x-1.5">
            {visible.map((item) => (
              <div
                key={item.id}
                className="relative w-10 h-12 bg-secondary border border-border rounded-sm overflow-hidden flex-shrink-0"
                title={item.name}
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : null}
              </div>
            ))}
            {overflow > 0 && (
              <div className="w-10 h-12 border border-border rounded-sm flex items-center justify-center bg-background text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                +{overflow}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
            <p className="text-sm italic font-black tracking-tighter mt-0.5">
              {formatPrice(order.total)}
            </p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-2 min-w-0 md:max-w-xs">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground leading-relaxed truncate">
            {order.customer_address}, {order.city}
          </p>
        </div>
      </div>

      {/* Action row — only when payment is needed */}
      {showPayCTA && (
        <div className="pt-4 border-t border-dashed border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Payment Required
          </p>
          <Button asChild className="rounded-md h-10 px-4 text-[10px] font-mono uppercase tracking-[0.3em]">
            <a href={order.payment_url} target="_blank" rel="noopener noreferrer">
              Complete Payment
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  label,
  heading,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  heading: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="border border-dashed border-border rounded-md p-14 text-center">
      <Icon className="h-6 w-6 mx-auto text-muted-foreground mb-4" strokeWidth={1.75} />
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
        {label}
      </p>
      <h3 className="text-2xl italic font-black uppercase tracking-tighter mb-2">{heading}</h3>
      <p className="text-sm text-muted-foreground mb-6">{body}</p>
      {action}
    </div>
  )
}
