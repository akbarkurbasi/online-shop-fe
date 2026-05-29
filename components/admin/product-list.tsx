'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Star,
  EyeOff,
  X,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { Product, Category } from '@/lib/types'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { formatPrice, cn } from '@/lib/utils'

type View = 'grid' | 'list'
type StockFilter = 'all' | 'in' | 'low' | 'out'
type SortKey = 'newest' | 'name' | 'price-desc' | 'price-asc' | 'stock-asc'
type BulkAction = 'delete' | 'feature' | 'out'

const PER_PAGE_OPTIONS = [8, 16, 32, 64]

function stockBucket(stock: number): 'in' | 'low' | 'out' {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'
  return 'in'
}

function stockLabel(stock: number): string {
  const b = stockBucket(stock)
  if (b === 'out') return 'Out'
  if (b === 'low') return `Only ${stock} Left`
  return `${stock} In Stock`
}

function stockChipClass(stock: number): string {
  const b = stockBucket(stock)
  if (b === 'out') return 'border-destructive text-destructive'
  if (b === 'low') return 'border-accent text-accent'
  return 'border-border text-muted-foreground'
}

export function ProductList() {
  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('grid')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [perPage, setPerPage] = useState<number>(8)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [isSyncing, setIsSyncing] = useState(false)

  const handleBulkSync = async () => {
    if (products.length === 0) {
      toast.error('No products available to sync')
      return
    }
    setIsSyncing(true)
    const loadToast = toast.loading('Syncing products to ML service...')
    try {
      const response = await adminService.bulkSyncProducts(products)
      if (response.sync_success) {
        toast.success(response.message || 'All products synced to recommendation service!')
      } else {
        toast.error(response.message || 'Sync failed')
      }
    } catch (error) {
      console.error('Failed to sync products:', error)
      toast.error('Failed to sync products to recommendation service')
    } finally {
      toast.dismiss(loadToast)
      setIsSyncing(false)
    }
  }

  // Bulk-action dialog
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [isBulkRunning, setIsBulkRunning] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [productsData, categoriesData] = await Promise.allSettled([
        adminService.getProducts(),
        adminService.getCategories(),
      ])

      if (productsData.status === 'fulfilled') {
        setProducts(productsData.value.data.items || [])
      } else {
        toast.error('Failed to load products')
      }

      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value.data || [])
      }
    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, stockFilter, sortBy, perPage])

  const getCategoryName = (slugOrId: string) => {
    if (!slugOrId) return 'No Category'
    const category = categories.find((c) => c.slug === slugOrId || c.id === slugOrId)
    return category ? category.name : slugOrId
  }

  const stats = useMemo(() => {
    return {
      total: products.length,
      in: products.filter((p) => stockBucket(p.stock) === 'in').length,
      low: products.filter((p) => stockBucket(p.stock) === 'low').length,
      out: products.filter((p) => stockBucket(p.stock) === 'out').length,
    }
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter

      const bucket = stockBucket(p.stock)
      const matchesStock = stockFilter === 'all' || bucket === stockFilter

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchQuery, categoryFilter, stockFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    switch (sortBy) {
      case 'name':
        return arr.sort((a, b) => a.name.localeCompare(b.name))
      case 'price-desc':
        return arr.sort((a, b) => b.price - a.price)
      case 'price-asc':
        return arr.sort((a, b) => a.price - b.price)
      case 'stock-asc':
        return arr.sort((a, b) => a.stock - b.stock)
      case 'newest':
      default:
        return arr.sort((a, b) => {
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0
          return bd - ad
        })
    }
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage)

  const visibleIds = useMemo(() => paginated.map((p) => p.id), [paginated])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const hasFilters =
    searchQuery !== '' || categoryFilter !== 'all' || stockFilter !== 'all'

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStockFilter('all')
    setSortBy('newest')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await adminService.deleteProduct(id)
      toast.success('Product deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const handleToggleFeatured = async (product: Product) => {
    try {
      await adminService.updateProduct(product.id, { featured: !product.featured })
      toast.success(product.featured ? 'Removed from featured' : 'Added to featured')
      fetchData()
    } catch {
      toast.error('Failed to update product')
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return
    const ids = Array.from(selected)
    setIsBulkRunning(true)
    try {
      if (bulkAction === 'delete') {
        await Promise.all(ids.map((id) => adminService.deleteProduct(id)))
        toast.success(`${ids.length} products deleted`)
      } else if (bulkAction === 'feature') {
        const idSet = new Set(ids)
        const toUpdate = products.filter((p) => idSet.has(p.id))
        const allFeatured = toUpdate.every((p) => p.featured)
        const nextValue = !allFeatured
        await Promise.all(
          toUpdate.map((p) => adminService.updateProduct(p.id, { featured: nextValue }))
        )
        toast.success(`${ids.length} products ${nextValue ? 'featured' : 'unfeatured'}`)
      } else if (bulkAction === 'out') {
        await Promise.all(
          ids.map((id) => adminService.updateProduct(id, { inStock: false, stock: 0 }))
        )
        toast.success(`${ids.length} products marked out of stock`)
      }
      setSelected(new Set())
      fetchData()
    } catch (error) {
      console.error('Bulk action failed:', error)
      toast.error('Bulk action failed')
    } finally {
      setIsBulkRunning(false)
      setBulkAction(null)
    }
  }

  // Sort handlers for list-view headers
  const flipSort = (key: 'name' | 'price' | 'stock') => {
    if (key === 'name') setSortBy('name')
    else if (key === 'price') setSortBy(sortBy === 'price-desc' ? 'price-asc' : 'price-desc')
    else if (key === 'stock') setSortBy('stock-asc')
  }

  return (
    <div className="space-y-8">
      {/* Stock-health stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
        {[
          { label: 'Total', value: stats.total, key: 'all' as StockFilter },
          { label: 'In Stock', value: stats.in, key: 'in' as StockFilter },
          { label: 'Low Stock', value: stats.low, key: 'low' as StockFilter, cobalt: true },
          { label: 'Out Of Stock', value: stats.out, key: 'out' as StockFilter, destructive: true },
        ].map((item) => {
          const isActive = stockFilter === item.key
          return (
            <button
              key={item.label}
              onClick={() => setStockFilter(item.key)}
              className={cn(
                'bg-background p-5 text-left transition-colors',
                isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
              )}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                / {item.label}
              </p>
              <p
                className={cn(
                  'text-3xl italic font-black uppercase tracking-tighter',
                  item.cobalt && 'text-accent',
                  item.destructive && item.value > 0 && 'text-destructive'
                )}
              >
                {item.value}
              </p>
            </button>
          )
        })}
      </div>

      {/* Filter / sort row */}
      <div className="flex flex-col lg:flex-row gap-3 pb-6 border-b border-border">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products, categories…"
            className="pl-9 h-11 rounded-md text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[140px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name · A–Z</SelectItem>
              <SelectItem value="price-desc">Price · High → Low</SelectItem>
              <SelectItem value="price-asc">Price · Low → High</SelectItem>
              <SelectItem value="stock-asc">Stock · Low → High</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'h-11 w-11 flex items-center justify-center transition-colors',
                view === 'grid' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-secondary'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'h-11 w-11 flex items-center justify-center transition-colors border-l border-border',
                view === 'list' ? 'bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-secondary'
              )}
              aria-label="List view"
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            onClick={handleBulkSync}
            disabled={isSyncing || isLoading}
            variant="outline"
            className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em] ml-auto lg:ml-0 border-border text-foreground hover:bg-secondary"
          >
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
            )}
            Sync Products
          </Button>

          <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
            <Link href="/admin/products/new">
              <Plus className="h-3.5 w-3.5 mr-2" />
              New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Active filter pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
              Search · &ldquo;{searchQuery}&rdquo;
            </button>
          )}
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
              Category · {getCategoryName(categoryFilter)}
            </button>
          )}
          {stockFilter !== 'all' && (
            <button
              onClick={() => setStockFilter('all')}
              className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
              Stock · {stockFilter === 'in' ? 'In' : stockFilter === 'low' ? 'Low' : 'Out'}
            </button>
          )}
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 px-4 py-3 border border-foreground bg-foreground text-background rounded-md animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em]">
            / {selected.size} Selected
          </p>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAction('feature')}
            className="h-9 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] bg-transparent border-background/40 text-background hover:bg-background hover:text-foreground"
          >
            <Star className="h-3 w-3 mr-1.5" />
            Toggle Featured
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAction('out')}
            className="h-9 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] bg-transparent border-background/40 text-background hover:bg-background hover:text-foreground"
          >
            <EyeOff className="h-3 w-3 mr-1.5" />
            Mark Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAction('delete')}
            className="h-9 px-3 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] bg-transparent border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Delete
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[10px] font-mono uppercase tracking-[0.2em] text-background/60 hover:text-background transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Items area */}
      {isLoading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[4/5] bg-secondary animate-pulse rounded-md" />
                <div className="h-3 bg-secondary animate-pulse rounded-sm w-2/3" />
                <div className="h-4 bg-secondary animate-pulse rounded-sm w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-secondary animate-pulse rounded-md" />
            ))}
          </div>
        )
      ) : paginated.length === 0 ? (
        <div className="border border-border rounded-md p-12 text-left">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            / {hasFilters ? 'No Results' : 'Empty'}
          </p>
          <p className="text-2xl italic font-black uppercase tracking-tighter mb-3">
            {hasFilters ? 'No Matching Products' : 'No Products Yet'}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
            {hasFilters ? 'Try clearing filters to see all products.' : 'Start by adding your first product to the catalog.'}
          </p>
          {hasFilters ? (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Clear Filters →
            </Button>
          ) : (
            <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
              <Link href="/admin/products/new">
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Product →
              </Link>
            </Button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((product) => {
            const isSelected = selected.has(product.id)
            const stockState = stockBucket(product.stock)
            return (
              <div
                key={product.id}
                className={cn(
                  'group relative border bg-background transition-colors rounded-md overflow-hidden',
                  isSelected ? 'border-foreground' : 'border-border hover:border-foreground/40'
                )}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  )}

                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectOne(product.id)}
                      className={cn(
                        'rounded-sm h-5 w-5 transition-opacity data-[state=checked]:bg-foreground data-[state=checked]:border-foreground bg-background/90 backdrop-blur',
                        isSelected || selected.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    />
                  </div>

                  {/* Stock chip */}
                  <span
                    className={cn(
                      'absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[9px] font-mono uppercase tracking-[0.2em] bg-background/90 backdrop-blur',
                      stockChipClass(product.stock)
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {stockState === 'out' ? 'Out' : stockState === 'low' ? 'Low' : 'In Stock'}
                  </span>

                  {/* Featured chip */}
                  {product.featured && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                      <Star className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] bg-background text-foreground hover:bg-foreground hover:text-background">
                      <Link href={`/admin/products/${product.id}`}>
                        <Edit2 className="h-3 w-3 mr-1.5" />
                        Edit
                      </Link>
                    </Button>
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      className={cn(
                        'h-9 w-9 flex items-center justify-center rounded-md border transition-colors',
                        product.featured
                          ? 'bg-accent text-accent-foreground border-accent hover:bg-background hover:text-accent'
                          : 'bg-background text-foreground border-border hover:bg-foreground hover:text-background'
                      )}
                      title={product.featured ? 'Unfeature' : 'Feature'}
                    >
                      <Star className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-destructive bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Out of stock dim overlay */}
                  {stockState === 'out' && (
                    <div className="absolute inset-0 bg-foreground/40 pointer-events-none group-hover:opacity-0 transition-opacity" />
                  )}
                </div>

                {/* Meta */}
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    / {getCategoryName(product.category)}
                  </p>
                  <h3 className="text-sm italic font-black uppercase tracking-tighter line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-bold tracking-tight">{formatPrice(product.price)}</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                      {stockLabel(product.stock)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // List view
        <div className="border border-border rounded-md overflow-hidden bg-background">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="w-10 px-5 py-3">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      className="rounded-sm h-4 w-4 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                    />
                  </th>
                  <th className="w-10"></th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('name')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Product
                      {sortBy === 'name' && <ChevronUp className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Category
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('price')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Price
                      {sortBy === 'price-desc' && <ChevronDown className="h-3 w-3" />}
                      {sortBy === 'price-asc' && <ChevronUp className="h-3 w-3" />}
                    </span>
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('stock')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Stock
                      {sortBy === 'stock-asc' && <ChevronUp className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((product) => {
                  const isExpanded = expandedRows.has(product.id)
                  const hasVariants = product.variants && product.variants.length > 0
                  const isSelected = selected.has(product.id)
                  return (
                    <React.Fragment key={product.id}>
                      <tr
                        className={cn(
                          'hover:bg-secondary/50 transition-colors group',
                          (isSelected || isExpanded) && 'bg-secondary/40'
                        )}
                      >
                        <td className="px-5 py-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(product.id)}
                            className="rounded-sm h-4 w-4 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </td>
                        <td className="pl-2 pr-3">
                          {hasVariants ? (
                            <button
                              onClick={() => toggleRowExpansion(product.id)}
                              className="p-1 hover:bg-foreground hover:text-background rounded-sm transition-colors text-muted-foreground"
                              aria-label="Toggle variants"
                            >
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          ) : (
                            <div className="w-6" />
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-20 rounded-md bg-secondary border border-border overflow-hidden shrink-0">
                              {product.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs italic font-black uppercase tracking-tighter leading-tight">
                                  {product.name}
                                </p>
                                {product.featured && (
                                  <Star className="h-3 w-3 text-accent fill-accent shrink-0" />
                                )}
                              </div>
                              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em] mt-1">
                                SKU · {product.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 border border-border rounded-md">
                            / {getCategoryName(product.category)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm italic font-black tracking-tighter">{formatPrice(product.price)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] w-fit',
                                stockChipClass(product.stock)
                              )}
                            >
                              <span className="w-1 h-1 rounded-full bg-current" />
                              {stockLabel(product.stock)}
                            </span>
                            {hasVariants && (
                              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                {product.variants?.length} {product.variants?.length === 1 ? 'variant' : 'variants'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleFeatured(product)}
                              className={cn(
                                'h-9 w-9 flex items-center justify-center rounded-md border transition-colors',
                                product.featured
                                  ? 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
                                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                              )}
                              title={product.featured ? 'Unfeature' : 'Feature'}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                            <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-md">
                              <Link href={`/admin/products/${product.id}`}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && hasVariants && (
                        <tr className="bg-secondary/30 border-l-2 border-l-accent">
                          <td colSpan={7} className="px-10 py-6">
                            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">/ Variants</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {product.variants?.map((variant) => (
                                <div
                                  key={variant.id}
                                  className="bg-background border border-border hover:border-foreground transition-colors rounded-md p-4 flex justify-between items-center"
                                >
                                  <div className="space-y-1.5">
                                    <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 border border-border rounded-sm">
                                      {variant.type}
                                    </span>
                                    <p className="text-xs font-bold uppercase tracking-tight">{variant.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm italic font-black tracking-tighter">
                                      {formatPrice(variant.price || product.price)}
                                    </p>
                                    <p
                                      className={cn(
                                        'text-[10px] font-mono uppercase tracking-[0.2em] mt-1',
                                        variant.stock > 0 ? 'text-muted-foreground' : 'text-destructive'
                                      )}
                                    >
                                      {variant.stock} units
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, sorted.length)} of {sorted.length}
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

      {/* Bulk-action confirm dialog */}
      <AlertDialog open={bulkAction !== null} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Confirm</p>
            <AlertDialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              {bulkAction === 'delete' && 'Delete Products?'}
              {bulkAction === 'feature' && 'Toggle Featured?'}
              {bulkAction === 'out' && 'Mark Out of Stock?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              {bulkAction === 'delete' &&
                `This will permanently delete ${selected.size} product${selected.size === 1 ? '' : 's'}. This cannot be undone.`}
              {bulkAction === 'feature' &&
                `This will toggle the featured flag on ${selected.size} product${selected.size === 1 ? '' : 's'}.`}
              {bulkAction === 'out' &&
                `This will mark ${selected.size} product${selected.size === 1 ? '' : 's'} as out of stock (stock set to 0).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel
              disabled={isBulkRunning}
              className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={runBulkAction}
              disabled={isBulkRunning}
              className={cn(
                'rounded-md h-11 px-6 text-[11px] font-mono uppercase tracking-[0.3em]',
                bulkAction === 'delete' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
            >
              {isBulkRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Working…
                </>
              ) : (
                <>
                  Confirm →
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
