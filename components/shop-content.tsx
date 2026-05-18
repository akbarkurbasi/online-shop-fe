'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { useFilters } from '@/lib/store/filters'
import type { Product, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, SlidersHorizontal, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'

import { productService } from '@/services/productService'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const DEFAULT_MIN = 0
const DEFAULT_MAX = 20000000

interface ShopContentProps {
  initialProducts: Product[]
}

type SectionKey = 'category' | 'size' | 'price'

export function ShopContent({ initialProducts }: ShopContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialLoadDone = useRef(false)

  const {
    selectedCategories,
    setCategories,
    selectedSizes,
    setSizes,
    priceRange,
    setPriceRange,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    resetFilters,
  } = useFilters()

  const [categories, setCategoriesList] = useState<Category[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    category: true,
    size: true,
    price: true,
  })

  // Pagination (client-side, after filter/sort)
  const PER_PAGE_OPTIONS = [12, 24, 36, 48]
  const [perPage, setPerPage] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await productService.getCategories()
        setCategoriesList(data.data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCats()
  }, [])

  // Set initial category from URL params
  useEffect(() => {
    if (initialLoadDone.current || categories.length === 0) return
    const category = searchParams.get('category')
    if (category && categories.some((c) => c.slug === category)) {
      setCategories([category])
    }
    initialLoadDone.current = true
  }, [searchParams, setCategories, categories])

  const toggleCategory = (slug: string) => {
    const next = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug]
    setCategories(next)
    if (searchParams.has('category')) {
      router.replace('/shop', { scroll: false })
    }
  }

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size]
    setSizes(next)
  }

  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const getCategoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug

  const isPriceDirty = priceRange[0] !== DEFAULT_MIN || priceRange[1] !== DEFAULT_MAX

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    isPriceDirty ||
    searchQuery !== '' ||
    inStockOnly

  const activeFilterCount =
    selectedCategories.length +
    selectedSizes.length +
    (isPriceDirty ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (inStockOnly ? 1 : 0)

  // Filter + sort
  const products = useMemo(() => {
    let filtered = [...initialProducts]

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category))
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants?.some((v) => v.type === 'size' && selectedSizes.includes(v.value))
      )
    }

    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
    }

    if (inStockOnly) {
      filtered = filtered.filter((p) => p.inStock && p.stock > 0)
    }

    switch (sortBy) {
      case 'price-low':
        return [...filtered].sort((a, b) => a.price - b.price)
      case 'price-high':
        return [...filtered].sort((a, b) => b.price - a.price)
      case 'popular':
        return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case 'newest':
      default:
        return [...filtered].sort((a, b) => {
          const ad = a.created_at ? new Date(a.created_at).getTime() : 0
          const bd = b.created_at ? new Date(b.created_at).getTime() : 0
          return bd - ad
        })
    }
  }, [
    initialProducts,
    selectedCategories,
    selectedSizes,
    priceRange,
    searchQuery,
    sortBy,
    inStockOnly,
  ])

  // Reset to page 1 whenever the filter/sort/perPage changes
  useEffect(() => {
    setCurrentPage(1)
  }, [
    selectedCategories,
    selectedSizes,
    priceRange,
    searchQuery,
    sortBy,
    inStockOnly,
    perPage,
  ])

  const totalPages = Math.max(1, Math.ceil(products.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = products.slice((safePage - 1) * perPage, safePage * perPage)

  const clearSearch = () => setSearchQuery('')
  const clearPrice = () => setPriceRange([DEFAULT_MIN, DEFAULT_MAX])
  const clearAll = () => {
    resetFilters()
    setInStockOnly(false)
  }

  // --- Sidebar section component (inline for scoping) ---
  const SectionHeader = ({
    sectionKey,
    label,
    count,
  }: {
    sectionKey: SectionKey
    label: string
    count: number
  }) => {
    const isOpen = openSections[sectionKey]
    return (
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
          / {label}
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-4 px-1.5 bg-foreground text-background text-[9px] font-mono tracking-tight rounded-sm">
              {count}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    )
  }

  // --- Filter content (used in both sidebar and mobile drawer) ---
  const FilterContent = (
    <div className="space-y-8">
      {/* In-stock quick toggle */}
      <div className="flex items-center justify-between border border-border rounded-md p-3.5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-foreground">/ In Stock Only</p>
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Hide sold-out pieces
          </p>
        </div>
        <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
      </div>

      {/* Search */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Search</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pieces…"
            className="pl-9 pr-9 h-11 rounded-md text-xs font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3 border-t border-border pt-6">
        <SectionHeader sectionKey="category" label="Category" count={selectedCategories.length} />
        {openSections.category && (
          <div className="space-y-2.5 pt-1">
            {categories.length === 0 ? (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Loading categories…
              </p>
            ) : (
              categories.map((category) => {
                const checked = selectedCategories.includes(category.slug)
                return (
                  <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.slug)}
                      className="rounded-sm border-border accent-foreground w-4 h-4 cursor-pointer"
                    />
                    <span
                      className={cn(
                        'capitalize text-xs font-bold uppercase tracking-tight transition-colors flex-1',
                        checked ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {category.name}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Size */}
      <div className="space-y-3 border-t border-border pt-6">
        <SectionHeader sectionKey="size" label="Size" count={selectedSizes.length} />
        {openSections.size && (
          <div className="grid grid-cols-3 gap-1.5 pt-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  'h-11 rounded-md border transition-colors text-[11px] font-mono uppercase tracking-[0.2em]',
                  selectedSizes.includes(size)
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="space-y-3 border-t border-border pt-6">
        <SectionHeader sectionKey="price" label="Price" count={isPriceDirty ? 1 : 0} />
        {openSections.price && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">From</span>
                <span className="text-sm font-mono tracking-tight">{formatPrice(priceRange[0])}</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Up To</span>
                <span className="text-sm font-mono tracking-tight">{formatPrice(priceRange[1])}</span>
              </div>
            </div>
            <div className="space-y-4">
              <input
                type="range"
                min={DEFAULT_MIN}
                max={DEFAULT_MAX}
                step={100000}
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Math.min(parseInt(e.target.value), priceRange[1]), priceRange[1]])
                }
                className="w-full accent-foreground h-1 bg-secondary appearance-none cursor-pointer"
              />
              <input
                type="range"
                min={DEFAULT_MIN}
                max={DEFAULT_MAX}
                step={100000}
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Math.max(parseInt(e.target.value), priceRange[0])])
                }
                className="w-full accent-foreground h-1 bg-secondary appearance-none cursor-pointer"
              />
            </div>
            {isPriceDirty && (
              <button
                type="button"
                onClick={clearPrice}
                className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset price
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clear all */}
      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-md text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-foreground hover:text-background transition-colors"
          onClick={clearAll}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-foreground text-background py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-8 flex-wrap">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ Shop · FW 26</p>
              <h1 className="text-5xl md:text-7xl italic font-black uppercase tracking-tighter leading-[0.95]">
                The<br />Collection
              </h1>
            </div>
            <p className="text-sm text-background/60 max-w-xs leading-relaxed">
              Every piece engineered to move with you. Filter by category, size, and price below.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Quick category chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 custom-scrollbar">
              <button
                type="button"
                onClick={() => setCategories([])}
                className={cn(
                  'shrink-0 h-9 px-4 rounded-md border transition-colors text-[10px] font-mono uppercase tracking-[0.2em]',
                  selectedCategories.length === 0
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              {categories.map((c) => {
                const active = selectedCategories.includes(c.slug)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      // Single-select toggle from quick-chip strip
                      if (active && selectedCategories.length === 1) {
                        setCategories([])
                      } else {
                        setCategories([c.slug])
                      }
                      if (searchParams.has('category')) {
                        router.replace('/shop', { scroll: false })
                      }
                    }}
                    className={cn(
                      'shrink-0 h-9 px-4 rounded-md border transition-colors text-[10px] font-mono uppercase tracking-[0.2em]',
                      active
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    )}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Sidebar Filters — Desktop */}
            <aside className="hidden lg:block">
              <div className="lg:sticky lg:top-32 lg:h-fit lg:self-start">
                <div className="flex justify-between items-center mb-8 pb-5 border-b border-border">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Refine</p>
                    <h3 className="text-2xl italic font-black uppercase tracking-tighter">Filters</h3>
                  </div>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-accent text-accent-foreground text-[10px] font-mono uppercase tracking-[0.2em] rounded-md">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {FilterContent}
              </div>
            </aside>

            {/* Products Grid */}
            <div className="lg:col-span-3 space-y-6">
              {/* Controls row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-5 border-b border-border">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    / Showing
                  </p>
                  <p className="text-2xl italic font-black uppercase tracking-tighter">
                    {products.length}
                    <span className="text-muted-foreground font-mono not-italic tracking-[0.2em] text-xs ml-2">
                      {products.length === 1 ? 'Piece' : 'Pieces'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[200px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="price-low">Price · Low → High</SelectItem>
                      <SelectItem value="price-high">Price · High → Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden h-11 px-4 rounded-md text-[11px] font-mono uppercase tracking-[0.3em] flex items-center gap-2"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-foreground text-background text-[10px] font-mono tracking-tight rounded-sm">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Active filter pills */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Search · &ldquo;{searchQuery}&rdquo;
                    </button>
                  )}
                  {selectedCategories.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleCategory(slug)}
                      className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                      {getCategoryName(slug)}
                    </button>
                  ))}
                  {selectedSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Size · {size}
                    </button>
                  ))}
                  {isPriceDirty && (
                    <button
                      type="button"
                      onClick={clearPrice}
                      className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                      {formatPrice(priceRange[0])} → {formatPrice(priceRange[1])}
                    </button>
                  )}
                  {inStockOnly && (
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                      In Stock Only
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Grid / Empty */}
              {products.length === 0 ? (
                <div className="flex flex-col items-start py-12 border border-border rounded-md p-12 space-y-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ No Results</p>
                  <h3 className="text-3xl italic font-black uppercase tracking-tighter">No Matches Found</h3>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    Refine your filters or clear them to keep browsing the full collection.
                  </p>
                  <Button onClick={clearAll} className="rounded-md h-12 px-6 text-[11px] font-mono uppercase tracking-[0.3em]">
                    Reset Filters →
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 md:gap-x-4 gap-y-10 animate-in fade-in duration-500">
                    {paginated.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {products.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 mt-2 border-t border-border">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                        Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, products.length)} of {products.length}
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
                          ← Prev
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
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-[100] transition-opacity duration-300',
          mobileFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!mobileFiltersOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setMobileFiltersOpen(false)}
        />
        {/* Sheet */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 max-h-[88vh] bg-background border-t border-border rounded-t-md flex flex-col transition-transform duration-300',
            mobileFiltersOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Refine</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter">Filters</h3>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="h-9 w-9 flex items-center justify-center border border-border rounded-md hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">{FilterContent}</div>
          <div className="px-5 py-4 border-t border-border flex items-center gap-2 bg-background">
            <Button
              type="button"
              variant="outline"
              disabled={!hasFilters}
              onClick={clearAll}
              className="rounded-md h-12 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 rounded-md h-12 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Show {products.length} {products.length === 1 ? 'Piece' : 'Pieces'} →
            </Button>
          </div>
        </div>
      </div>

      <Footer />
      <CartDrawer />
    </div>
  )
}
