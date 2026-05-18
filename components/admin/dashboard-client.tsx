'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  Store,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
} from 'recharts'
import type { Product, Article, Order } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { formatPrice, cn } from '@/lib/utils'
import { STATUS_STYLES, STATUS_FALLBACK_STYLE } from '@/lib/order-status'
import { AdminStats } from '@/services/adminService'

interface DashboardClientProps {
  stats: AdminStats | null
  products: Product[]
  articles: Article[]
  recentOrders: Order[]
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${day} / ${month}`
}


// Color map for the donut — uses CSS variables so it follows the theme
const STATUS_COLORS: Record<string, string> = {
  delivered: '#0A0A0A',
  paid: '#0A0A0A',
  shipped: '#404040',
  pending: '#1E3CFF',
  failed: '#E53935',
  cancelled: '#E53935',
  expired: '#A3A3A3',
}

function buildLast7Days(orders: Order[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets: { day: string; date: Date; count: number; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({
      day: d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3),
      date: d,
      count: 0,
      revenue: 0,
    })
  }

  for (const order of orders) {
    const od = new Date(order.created_at)
    if (Number.isNaN(od.getTime())) continue
    od.setHours(0, 0, 0, 0)
    const bucket = buckets.find((b) => b.date.getTime() === od.getTime())
    if (bucket) {
      bucket.count += 1
      bucket.revenue += order.total || 0
    }
  }
  return buckets
}

export function DashboardClient({ stats, articles, recentOrders }: DashboardClientProps) {
  const last7 = useMemo(() => buildLast7Days(recentOrders), [recentOrders])

  const weekRevenue = last7.reduce((sum, b) => sum + b.revenue, 0)
  const prevHalf = last7.slice(0, 3).reduce((sum, b) => sum + b.revenue, 0)
  const recentHalf = last7.slice(4).reduce((sum, b) => sum + b.revenue, 0)
  const revenueDelta = prevHalf > 0 ? ((recentHalf - prevHalf) / prevHalf) * 100 : 0
  const isRevenueUp = revenueDelta >= 0

  const weekOrders = last7.reduce((sum, b) => sum + b.count, 0)

  const statusData = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const o of recentOrders) {
      acc[o.status] = (acc[o.status] || 0) + 1
    }
    return Object.entries(acc).map(([name, value]) => ({ name, value }))
  }, [recentOrders])

  const totalStatusCount = statusData.reduce((sum, s) => sum + s.value, 0) || 1

  const avgOrder = weekOrders > 0 ? weekRevenue / weekOrders : 0

  // Tiny seed data for stat tile sparklines — derived from week buckets
  const ordersSpark = last7.map((b) => ({ value: b.count }))
  const productsSpark = ordersSpark.map((p, i) => ({ value: Math.max(1, p.value + (i % 2 === 0 ? 1 : 0)) }))
  const customersSpark = last7.map((b, i) => ({ value: Math.max(1, Math.round(b.count * 0.7) + (i === 6 ? 1 : 0)) }))
  const avgSpark = last7.map((b) => ({ value: b.count > 0 ? Math.round(b.revenue / b.count) : 0 }))

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 01 — Overview</p>
          <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">Dashboard</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-3 flex items-center gap-2">
            <Activity className="h-3 w-3 text-accent animate-pulse" />
            Live · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
          <Link href="/">
            <Store className="h-3.5 w-3.5 mr-2" />
            View Shop
          </Link>
        </Button>
      </div>

      {/* Hero row — Revenue + Status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden">
        {/* Revenue hero card — spans 2 cols */}
        <div className="lg:col-span-2 bg-background p-7 flex flex-col gap-5 min-h-[260px]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Revenue · Last 7 Days</p>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {formatDateShort(last7[0].date.toISOString())} — {formatDateShort(last7[6].date.toISOString())}
            </span>
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <p className="text-5xl md:text-6xl italic font-black uppercase tracking-tighter text-accent">
              {formatPrice(weekRevenue)}
            </p>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
                isRevenueUp ? 'border-emerald-600/30 bg-emerald-600/5 text-emerald-700' : 'border-destructive/30 bg-destructive/5 text-destructive'
              )}
            >
              {isRevenueUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isRevenueUp ? '+' : ''}{revenueDelta.toFixed(1)}%
            </div>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {weekOrders} {weekOrders === 1 ? 'order' : 'orders'} · Avg {formatPrice(avgOrder)}
          </p>
          <div className="flex-1 -mx-3 -mb-3">
            <ResponsiveContainer width="100%" height="100%" minHeight={120}>
              <LineChart data={last7} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3CFF" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1E3CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  cursor={{ stroke: '#0A0A0A', strokeWidth: 1 }}
                  contentStyle={{
                    background: '#0A0A0A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#A3A3A3', marginBottom: 4 }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1E3CFF"
                  strokeWidth={2}
                  fill="url(#rev-grad)"
                  dot={{ fill: '#1E3CFF', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0A0A0A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status donut */}
        <div className="bg-background p-7 flex flex-col gap-4 min-h-[260px]">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Status · Recent</p>
          {statusData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">No data yet</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-4">
              <div className="relative w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      innerRadius={36}
                      outerRadius={54}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#A3A3A3'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                  <p className="text-xl italic font-black tracking-tighter">{totalStatusCount}</p>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 min-w-0">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ background: STATUS_COLORS[s.name] || '#A3A3A3' }}
                    />
                    <span className="text-muted-foreground truncate flex-1">{s.name}</span>
                    <span className="text-foreground font-bold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Stat tiles with sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
        {[
          { label: 'Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, spark: ordersSpark, color: '#1E3CFF', delta: '+8.2%' },
          { label: 'Products', value: stats?.totalProducts || 0, icon: Package, spark: productsSpark, color: '#0A0A0A', delta: '+3 new' },
          { label: 'Customers', value: stats?.totalUsers || 0, icon: Users, spark: customersSpark, color: '#0A0A0A', delta: '+14' },
          { label: 'Avg Order', value: formatPrice(avgOrder), icon: TrendingUp, spark: avgSpark, color: '#0A0A0A', delta: isRevenueUp ? `+${revenueDelta.toFixed(1)}%` : `${revenueDelta.toFixed(1)}%`, deltaUp: isRevenueUp },
        ].map((item, i) => (
          <div key={i} className="bg-background p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                / {String(i + 1).padStart(2, '0')} — {item.label}
              </p>
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className={cn(
              'text-3xl italic font-black uppercase tracking-tighter',
              item.label === 'Orders' ? 'text-accent' : 'text-foreground'
            )}>
              {item.value}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                'text-[10px] font-mono uppercase tracking-[0.2em] inline-flex items-center gap-1',
                item.label === 'Avg Order'
                  ? (item.deltaUp ? 'text-emerald-700' : 'text-destructive')
                  : 'text-muted-foreground'
              )}>
                {item.delta}
              </span>
              <div className="h-8 flex-1 max-w-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.spark}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={item.color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly activity bar chart */}
      <div className="border border-border rounded-md bg-background p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Activity · Last 7 Days</p>
            <h2 className="text-2xl italic font-black uppercase tracking-tighter">Order Volume</h2>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {weekOrders} {weekOrders === 1 ? 'order' : 'orders'} total
          </p>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#737373', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
              />
              <Tooltip
                cursor={{ fill: '#F4F4F4' }}
                contentStyle={{
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#A3A3A3', marginBottom: 4 }}
                formatter={(value: number) => [`${value} ${value === 1 ? 'order' : 'orders'}`, 'Volume']}
              />
              <Bar dataKey="count" fill="#0A0A0A" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders + Latest Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Activity</p>
              <h2 className="text-2xl italic font-black uppercase tracking-tighter">Recent Orders</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="border border-border rounded-md overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Order</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Customer</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
                        <p className="text-base italic font-black uppercase tracking-tighter">No Orders Yet</p>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-secondary/50 transition-colors cursor-pointer">
                        <td className="px-5 py-4">
                          <p className="text-xs font-mono uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                            {formatDateShort(order.created_at)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-bold uppercase tracking-tight">{order.customer_name}</p>
                          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                            {order.customer_email}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
                              STATUS_STYLES[order.status] || STATUS_FALLBACK_STYLE
                            )}
                          >
                            <span className="w-1 h-1 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm italic font-black tracking-tighter">{formatPrice(order.total)}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Journal</p>
              <h2 className="text-2xl italic font-black uppercase tracking-tighter">Latest Articles</h2>
            </div>
          </div>

          <div className="space-y-3">
            {articles.slice(0, 4).length === 0 ? (
              <div className="border border-border rounded-md p-6 text-left">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
                <p className="text-base italic font-black uppercase tracking-tighter">No Articles Yet</p>
              </div>
            ) : (
              articles.slice(0, 4).map((article) => (
                <Link
                  key={article.id}
                  href={`/admin/articles/${article.id}`}
                  className="block bg-background border border-border hover:border-foreground transition-colors rounded-md p-4 group"
                >
                  <div className="flex gap-4">
                    <div className="h-14 w-14 rounded-md bg-secondary overflow-hidden shrink-0 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image || '/placeholder.jpg'}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                        / {article.category}
                      </p>
                      <h3 className="text-xs italic font-black uppercase tracking-tighter line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-2">
                        {article.author} · {article.readTime}m
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <Button
              variant="outline"
              className="w-full rounded-md h-11 text-[11px] font-mono uppercase tracking-[0.3em]"
              asChild
            >
              <Link href="/admin/articles">
                Manage Articles
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
