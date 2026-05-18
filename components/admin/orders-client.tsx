'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  Search,
  ChevronDown,
  RefreshCcw,
  Receipt,
  Clock,
  Truck,
  Coins,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminService } from '@/services/adminService'
import { formatPrice, cn } from '@/lib/utils'
import { STATUS_STYLES, STATUS_FALLBACK_STYLE } from '@/lib/order-status'
import { toast } from 'sonner'
import { OrderDetailModal } from '@/components/admin/order-detail-modal'
import type { Order } from '@/lib/types'

interface OrdersClientProps {
  initialOrders: Order[]
}

type StatusFilter = 'all' | Order['status']
type SortKey = 'newest' | 'oldest' | 'total-desc' | 'total-asc'

const STATUS_OPTIONS: StatusFilter[] = [
  'all',
  'pending',
  'paid',
  'shipped',
  'delivered',
  'failed',
  'cancelled',
]

const PER_PAGE_OPTIONS = [10, 20, 50, 100]

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState<number>(10)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Reset to page 1 whenever filter/sort/per-page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, sortKey, perPage])

  const fetchOrders = async () => {
    setIsRefreshing(true)
    try {
      const data = await adminService.getOrders()
      setOrders(data.data.items || [])
      toast.success('Orders refreshed')
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    try {
      await adminService.updateOrderStatus(id, status)
      toast.success(`Order #${id.slice(-6).toUpperCase()} updated to ${status}`)
      fetchOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  // ── Derived: stats, filter counts, filtered+sorted, paginated ─────────────
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length
    const shipped = orders.filter((o) => o.status === 'shipped').length
    const revenue = orders
      .filter((o) => o.status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    return { total: orders.length, pending, shipped, revenue }
  }, [orders])

  const filterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: orders.length,
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      failed: 0,
      expired: 0,
      cancelled: 0,
    }
    for (const o of orders) {
      counts[o.status as StatusFilter] = (counts[o.status as StatusFilter] || 0) + 1
    }
    return counts
  }, [orders])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      if (!matchesStatus) return false
      if (!q) return true
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_email.toLowerCase().includes(q)
      )
    })

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'total-desc':
          return (b.total || 0) - (a.total || 0)
        case 'total-asc':
          return (a.total || 0) - (b.total || 0)
      }
    })

    return list
  }, [orders, searchQuery, statusFilter, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== 'all'

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
            / 05 — Activity
          </p>
          <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">
            Orders
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-3">
            Track and manage every order across the store
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchOrders}
          disabled={isRefreshing}
          className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
        >
          <RefreshCcw className={cn('h-3.5 w-3.5 mr-2', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile index="01" label="Total Orders" value={String(stats.total)} icon={Receipt} />
        <StatTile
          index="02"
          label="Pending"
          value={String(stats.pending)}
          icon={Clock}
          accent={stats.pending > 0}
        />
        <StatTile index="03" label="Shipped" value={String(stats.shipped)} icon={Truck} />
        <StatTile index="04" label="Revenue" value={formatPrice(stats.revenue)} icon={Coins} accent />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border">
        {/* Top row: search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, name, or email…"
              className="pl-9 h-11 rounded-md text-xs font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-sm"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-11 w-[180px] rounded-md text-[10px] font-mono uppercase tracking-[0.2em]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Newest First
                </SelectItem>
                <SelectItem value="oldest" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Oldest First
                </SelectItem>
                <SelectItem value="total-desc" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Total · High to Low
                </SelectItem>
                <SelectItem value="total-asc" className="text-[10px] font-mono uppercase tracking-[0.2em]">
                  Total · Low to High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 border border-border rounded-md p-0.5 bg-background overflow-x-auto">
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
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        isFiltered ? (
          <div className="border border-dashed border-border rounded-md p-14 text-center">
            <Search className="h-6 w-6 mx-auto text-muted-foreground mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
              / No Match
            </p>
            <h3 className="text-2xl italic font-black uppercase tracking-tighter mb-2">Nothing Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              No orders match your search or filter. Try a different status or clear the search.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Clear Filters →
            </Button>
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-md p-14 text-center">
            <Receipt className="h-6 w-6 mx-auto text-muted-foreground mb-4" />
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
              / Empty
            </p>
            <h3 className="text-2xl italic font-black uppercase tracking-tighter mb-2">No Orders Yet</h3>
            <p className="text-sm text-muted-foreground">
              New orders from the store will show up here.
            </p>
          </div>
        )
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-secondary/50 transition-colors group cursor-pointer"
                    onClick={() => handleViewDetails(order)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-tight text-foreground">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-tight">
                        {order.customer_name}
                      </p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                        {order.customer_email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm italic font-black tracking-tighter">
                        {formatPrice(order.total)}
                      </p>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <select
                          className={cn(
                            'appearance-none bg-transparent text-[10px] font-mono uppercase tracking-[0.2em] pl-2.5 pr-7 py-1 border rounded-md cursor-pointer transition-colors focus:outline-none',
                            STATUS_STYLES[order.status] || STATUS_FALLBACK_STYLE,
                          )}
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value as Order['status'])
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="failed">Failed</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/80">
                        {formatDateShort(order.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        onClick={() => handleViewDetails(order)}
                        aria-label="View details"
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination footer */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Showing {(safePage - 1) * perPage + 1}–
            {Math.min(safePage * perPage, filtered.length)} of {filtered.length}
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

      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
      />
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
