'use client'

import React, { useMemo, useState } from 'react'
import {
  Shield,
  User as UserIcon,
  Plus,
  Trash2,
  Edit2,
  Search,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  LayoutGrid,
  Rows3,
  Users as UsersIcon,
  UserCog,
  Sparkles,
  ArrowUpDown,
  Receipt,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { adminService, AdminUser } from '@/services/adminService'
import { UserModal } from '@/components/admin/user-modal'
import { UserCartModal } from '@/components/admin/user-cart-modal'
import { formatPrice, cn } from '@/lib/utils'
import { STATUS_STYLES, STATUS_FALLBACK_STYLE } from '@/lib/order-status'
import type { Order } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface UsersTableProps {
  initialUsers: AdminUser[]
}

type ViewMode = 'grid' | 'list'
type RoleFilter = 'all' | 'admin' | 'customer'
type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc'

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  const days = Math.floor(diff / day)
  if (days < 1) return 'TODAY'
  if (days < 7) return `${days}D AGO`
  if (days < 30) return `${Math.floor(days / 7)}W AGO`
  if (days < 365) return `${Math.floor(days / 30)}MO AGO`
  return `${Math.floor(days / 365)}Y AGO`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '··'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}


export function UsersTable({ initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCartModalOpen, setIsCartModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null)

  // Orders sheet
  const [orderSheetUser, setOrderSheetUser] = useState<AdminUser | null>(null)
  const [userOrders, setUserOrders] = useState<Record<string, Order[]>>({})
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers()
      setUsers(data.data.items || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to reload users')
    }
  }

  const openOrdersSheet = async (user: AdminUser) => {
    setOrderSheetUser(user)
    if (userOrders[user.id]) return
    setIsLoadingOrders(true)
    try {
      const data = await adminService.getUserOrders(user.id)
      setUserOrders((prev) => ({ ...prev, [user.id]: data || [] }))
    } catch (error) {
      console.error('Error fetching user orders:', error)
      toast.error('Failed to load order history')
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleAddUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleViewCart = (user: AdminUser) => {
    setSelectedUser(user)
    setIsCartModalOpen(true)
  }

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    try {
      await adminService.deleteUser(userToDelete.id)
      toast.success('Customer deleted')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete customer')
    } finally {
      setIsDeleteOpen(false)
      setUserToDelete(null)
    }
  }

  // Derived: stats
  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === 'admin').length
    const customers = total - admins
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const recent = users.filter((u) => {
      const t = new Date(u.createdAt).getTime()
      return !Number.isNaN(t) && t >= thirtyDaysAgo
    }).length
    return { total, admins, customers, recent }
  }, [users])

  // Derived: filtered + sorted
  const visibleUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = users.filter((u) => {
      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter
      if (!matchesRole) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
      }
    })

    return list
  }, [users, searchQuery, roleFilter, sortKey])

  const isFiltered = searchQuery.trim().length > 0 || roleFilter !== 'all'

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
            / 04 — Audience
          </p>
          <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">
            Customers
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-3">
            Manage the people behind your store
          </p>
        </div>
        <Button
          onClick={handleAddUser}
          className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Customer
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          index="01"
          label="Total Audience"
          value={stats.total}
          icon={UsersIcon}
        />
        <StatTile
          index="02"
          label="Customers"
          value={stats.customers}
          icon={UserIcon}
        />
        <StatTile
          index="03"
          label="Administrators"
          value={stats.admins}
          icon={UserCog}
          accent
        />
        <StatTile
          index="04"
          label="New · 30 Days"
          value={stats.recent}
          icon={Sparkles}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
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

          {/* Role filter pills */}
          <div className="inline-flex border border-border rounded-md p-0.5 bg-background self-start">
            {(['all', 'customer', 'admin'] as RoleFilter[]).map((r) => {
              const active = roleFilter === r
              return (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'h-9 px-3 text-[10px] font-mono uppercase tracking-[0.2em] rounded-sm transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r === 'all' ? `All · ${stats.total}` : r === 'customer' ? `Customers · ${stats.customers}` : `Admins · ${stats.admins}`}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-9 w-[170px] rounded-md text-[10px] font-mono uppercase tracking-[0.2em]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-[10px] font-mono uppercase tracking-[0.2em]">Newest First</SelectItem>
                <SelectItem value="oldest" className="text-[10px] font-mono uppercase tracking-[0.2em]">Oldest First</SelectItem>
                <SelectItem value="name-asc" className="text-[10px] font-mono uppercase tracking-[0.2em]">Name · A–Z</SelectItem>
                <SelectItem value="name-desc" className="text-[10px] font-mono uppercase tracking-[0.2em]">Name · Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View toggle */}
          <div className="inline-flex border border-border rounded-md p-0.5 bg-background">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="List view"
              title="List view"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {visibleUsers.length === 0 ? (
        <EmptyState
          isFiltered={isFiltered}
          onClear={() => {
            setSearchQuery('')
            setRoleFilter('all')
          }}
          onAdd={handleAddUser}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => handleEditUser(user)}
              onDelete={() => handleDeleteClick(user)}
              onViewCart={() => handleViewCart(user)}
              onViewOrders={() => openOrdersSheet(user)}
            />
          ))}
        </div>
      ) : (
        <UserListTable
          users={visibleUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteClick}
          onViewCart={handleViewCart}
          onViewOrders={openOrdersSheet}
        />
      )}

      {/* Result count footer (only when filtered) */}
      {isFiltered && visibleUsers.length > 0 && (
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground border-t border-border pt-4">
          Showing {visibleUsers.length} of {users.length}
        </p>
      )}

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      <UserCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        userId={selectedUser?.id || null}
        userName={selectedUser?.name || null}
      />

      {/* Orders side sheet */}
      <Sheet open={!!orderSheetUser} onOpenChange={(o) => !o && setOrderSheetUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="px-6 py-5 border-b border-border space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Order History
            </p>
            <SheetTitle className="text-2xl italic font-black uppercase tracking-tighter">
              {orderSheetUser?.name || 'Customer'}
            </SheetTitle>
            <SheetDescription className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {orderSheetUser?.email}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 overflow-y-auto h-[calc(100vh-140px)] custom-scrollbar">
            {isLoadingOrders ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-md" />
                ))}
              </div>
            ) : !orderSheetUser ? null : (() => {
              const orders = userOrders[orderSheetUser.id] || []
              if (orders.length === 0) {
                return (
                  <div className="border border-dashed border-border rounded-md p-10 text-center">
                    <Receipt className="h-6 w-6 mx-auto text-muted-foreground mb-3" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Empty</p>
                    <p className="text-base italic font-black uppercase tracking-tighter">No Orders Yet</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-2">
                      This customer hasn&apos;t purchased anything.
                    </p>
                  </div>
                )
              }
              const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0)
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-border rounded-md p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Orders</p>
                      <p className="text-2xl italic font-black tracking-tighter">{orders.length}</p>
                    </div>
                    <div className="border border-border rounded-md p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Total Spent</p>
                      <p className="text-2xl italic font-black tracking-tighter">{formatPrice(totalSpent)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border rounded-md p-4 hover:border-foreground transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight">
                              #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                              {formatDateShort(order.created_at)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
                              STATUS_STYLES[order.status] || STATUS_FALLBACK_STYLE
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <p className="text-base italic font-black tracking-tighter">
                            {formatPrice(order.total)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.2em]"
                            onClick={() => (window.location.href = `/admin/orders?id=${order.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1.5" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Confirm</p>
            <AlertDialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              Delete Customer?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              This will permanently delete{' '}
              <span className="font-bold text-foreground">
                &quot;{userToDelete?.name}&quot;
              </span>{' '}
              and revoke their access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-md h-11 px-6 text-[11px] font-mono uppercase tracking-[0.3em] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  value: number
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'border border-border rounded-md p-5 bg-background relative overflow-hidden transition-colors hover:border-foreground',
        accent && 'border-accent/40'
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
      <p className="text-4xl italic font-black tracking-tighter">{value}</p>
    </div>
  )
}

function RoleBadge({ role }: { role: 'admin' | 'customer' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
        role === 'admin'
          ? 'border-accent text-accent'
          : 'border-border text-muted-foreground'
      )}
    >
      {role === 'admin' ? (
        <Shield className="h-3 w-3" />
      ) : (
        <UserIcon className="h-3 w-3" />
      )}
      {role}
    </span>
  )
}

function Avatar({ name, role, size = 'md' }: { name: string; role: 'admin' | 'customer'; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-9 w-9 text-[10px]' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-11 w-11 text-xs'
  return (
    <div
      className={cn(
        'border flex items-center justify-center font-mono uppercase tracking-tight rounded-sm shrink-0 font-bold',
        dim,
        role === 'admin'
          ? 'border-accent text-accent bg-accent/5'
          : 'border-foreground text-foreground'
      )}
    >
      {getInitials(name)}
    </div>
  )
}

function UserCard({
  user,
  onEdit,
  onDelete,
  onViewCart,
  onViewOrders,
}: {
  user: AdminUser
  onEdit: () => void
  onDelete: () => void
  onViewCart: () => void
  onViewOrders: () => void
}) {
  return (
    <div className="border border-border rounded-md bg-background p-5 hover:border-foreground transition-colors group flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <Avatar name={user.name} role={user.role} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold uppercase tracking-tight truncate">{user.name}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1 truncate">
            {user.email}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 w-8 flex items-center justify-center border border-transparent hover:border-border rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onViewOrders} className="text-[10px] font-mono uppercase tracking-[0.2em]">
              <Receipt className="h-3.5 w-3.5 mr-2" />
              Order History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onViewCart} className="text-[10px] font-mono uppercase tracking-[0.2em]">
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              View Cart
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="text-[10px] font-mono uppercase tracking-[0.2em]">
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Role</p>
          <RoleBadge role={user.role} />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Joined</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground">
            {formatRelative(user.createdAt)}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
            {formatDateShort(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewOrders}
          className="flex-1 h-9 rounded-md text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <Receipt className="h-3 w-3 mr-1.5" />
          Orders
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewCart}
          className="flex-1 h-9 rounded-md text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          <ShoppingCart className="h-3 w-3 mr-1.5" />
          Cart
        </Button>
      </div>
    </div>
  )
}

function UserListTable({
  users,
  onEdit,
  onDelete,
  onViewCart,
  onViewOrders,
}: {
  users: AdminUser[]
  onEdit: (u: AdminUser) => void
  onDelete: (u: AdminUser) => void
  onViewCart: (u: AdminUser) => void
  onViewOrders: (u: AdminUser) => void
}) {
  return (
    <div className="border border-border rounded-md overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary border-b border-border">
              <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Customer
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Role
              </th>
              <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Joined
              </th>
              <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/50 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} role={user.role} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-tight truncate">{user.name}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-5 py-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground">
                    {formatDateShort(user.createdAt)}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                    {formatRelative(user.createdAt)}
                  </p>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewOrders(user)}
                      title="Order history"
                      className="h-9 w-9 rounded-md"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewCart(user)}
                      title="View customer cart"
                      className="h-9 w-9 rounded-md"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(user)}
                      title="Edit"
                      className="h-9 w-9 rounded-md"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(user)}
                      title="Delete"
                      className="h-9 w-9 rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState({
  isFiltered,
  onClear,
  onAdd,
}: {
  isFiltered: boolean
  onClear: () => void
  onAdd: () => void
}) {
  if (isFiltered) {
    return (
      <div className="border border-dashed border-border rounded-md p-14 text-center">
        <Search className="h-6 w-6 mx-auto text-muted-foreground mb-4" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ No Match</p>
        <h3 className="text-2xl italic font-black uppercase tracking-tighter mb-2">Nothing Found</h3>
        <p className="text-sm text-muted-foreground mb-6">
          No customers match your filters. Try adjusting your search or role filter.
        </p>
        <Button
          variant="outline"
          onClick={onClear}
          className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
        >
          Clear Filters →
        </Button>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-border rounded-md p-14 text-center">
      <UsersIcon className="h-6 w-6 mx-auto text-muted-foreground mb-4" />
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
      <h3 className="text-2xl italic font-black uppercase tracking-tighter mb-2">No Customers Yet</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Add your first customer to start building your audience.
      </p>
      <Button
        onClick={onAdd}
        className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
      >
        <Plus className="mr-2 h-3.5 w-3.5" />
        Add Customer
      </Button>
    </div>
  )
}
