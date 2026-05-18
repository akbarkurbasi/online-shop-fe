'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Star,
  ArrowUpRight,
  X,
  Clock,
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
import type { Article } from '@/lib/types'
import { articleService } from '@/services/articleService'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type View = 'grid' | 'list'
type FeaturedFilter = 'all' | 'featured' | 'standard'
type SortKey = 'newest' | 'oldest' | 'title' | 'read-asc' | 'read-desc'
type BulkAction = 'delete' | 'feature'

const PER_PAGE_OPTIONS = [8, 16, 32, 64]

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

function isThisWeek(iso: string): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  return t > Date.now() - 7 * 24 * 60 * 60 * 1000
}

interface ArticlesClientProps {
  initialArticles: Article[]
}

export function ArticlesClient({ initialArticles }: ArticlesClientProps) {
  // Data
  const [articles, setArticles] = useState<Article[]>(initialArticles)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<View>('grid')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all')
  const [authorFilter, setAuthorFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [perPage, setPerPage] = useState<number>(8)
  const [currentPage, setCurrentPage] = useState(1)

  // Bulk-action dialog
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [isBulkRunning, setIsBulkRunning] = useState(false)

  const fetchArticles = async () => {
    try {
      const data = await articleService.getArticles()
      setArticles(data.data.items || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, categoryFilter, featuredFilter, authorFilter, sortBy, perPage])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return
    try {
      await articleService.deleteArticle(id)
      toast.success('Article deleted')
      fetchArticles()
    } catch {
      toast.error('Failed to delete article')
    }
  }

  const handleToggleFeatured = async (article: Article) => {
    try {
      await adminService.updateArticle(article.id, { featured: !article.featured })
      toast.success(article.featured ? 'Removed from featured' : 'Added to featured')
      fetchArticles()
    } catch {
      toast.error('Failed to update article')
    }
  }

  // Derived
  const categoryOptions = useMemo(
    () => Array.from(new Set(articles.map((a) => a.category).filter(Boolean))),
    [articles]
  )

  const authorOptions = useMemo(
    () => Array.from(new Set(articles.map((a) => a.author).filter(Boolean))),
    [articles]
  )

  const stats = useMemo(() => {
    return {
      total: articles.length,
      featured: articles.filter((a) => a.featured).length,
      thisWeek: articles.filter((a) => isThisWeek(a.publishedAt)).length,
      categories: new Set(articles.map((a) => a.category)).size,
    }
  }, [articles])

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter
      const matchesAuthor = authorFilter === 'all' || a.author === authorFilter
      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' && a.featured) ||
        (featuredFilter === 'standard' && !a.featured)

      return matchesSearch && matchesCategory && matchesAuthor && matchesFeatured
    })
  }, [articles, searchQuery, categoryFilter, authorFilter, featuredFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    switch (sortBy) {
      case 'oldest':
        return arr.sort(
          (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        )
      case 'title':
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      case 'read-asc':
        return arr.sort((a, b) => a.readTime - b.readTime)
      case 'read-desc':
        return arr.sort((a, b) => b.readTime - a.readTime)
      case 'newest':
      default:
        return arr.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
    }
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage)

  const visibleIds = useMemo(() => paginated.map((a) => a.id), [paginated])
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))

  const hasFilters =
    searchQuery !== '' ||
    categoryFilter !== 'all' ||
    authorFilter !== 'all' ||
    featuredFilter !== 'all'

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
    setAuthorFilter('all')
    setFeaturedFilter('all')
    setSortBy('newest')
  }

  const runBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return
    const ids = Array.from(selected)
    setIsBulkRunning(true)
    try {
      if (bulkAction === 'delete') {
        await Promise.all(ids.map((id) => articleService.deleteArticle(id)))
        toast.success(`${ids.length} articles deleted`)
      } else if (bulkAction === 'feature') {
        const idSet = new Set(ids)
        const toUpdate = articles.filter((a) => idSet.has(a.id))
        const allFeatured = toUpdate.every((a) => a.featured)
        const nextValue = !allFeatured
        await Promise.all(
          toUpdate.map((a) => adminService.updateArticle(a.id, { featured: nextValue }))
        )
        toast.success(`${ids.length} articles ${nextValue ? 'featured' : 'unfeatured'}`)
      }
      setSelected(new Set())
      fetchArticles()
    } catch (error) {
      console.error('Bulk action failed:', error)
      toast.error('Bulk action failed')
    } finally {
      setIsBulkRunning(false)
      setBulkAction(null)
    }
  }

  const flipSort = (key: 'title' | 'date' | 'read') => {
    if (key === 'title') setSortBy('title')
    else if (key === 'date') setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')
    else if (key === 'read') setSortBy(sortBy === 'read-asc' ? 'read-desc' : 'read-asc')
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 03 — Journal</p>
          <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">Articles</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-3">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} total
          </p>
        </div>
        <Button asChild className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
          <Link href="/admin/articles/new">
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Article
          </Link>
        </Button>
      </div>

      {/* Stat strip — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden">
        {[
          { label: 'Total', value: stats.total, action: () => setFeaturedFilter('all') },
          { label: 'Featured', value: stats.featured, cobalt: true, action: () => setFeaturedFilter('featured') },
          { label: 'This Week', value: stats.thisWeek, action: () => null },
          { label: 'Categories', value: stats.categories, action: () => null },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="bg-background p-5 text-left transition-colors hover:bg-secondary/50"
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
              / {item.label}
            </p>
            <p
              className={cn(
                'text-3xl italic font-black uppercase tracking-tighter',
                item.cobalt && 'text-accent'
              )}
            >
              {item.value}
            </p>
          </button>
        ))}
      </div>

      {/* Filter / sort row */}
      <div className="flex flex-col lg:flex-row gap-3 pb-6 border-b border-border">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or category…"
            className="pl-9 h-11 rounded-md text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[140px]">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authorOptions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={featuredFilter} onValueChange={(v) => setFeaturedFilter(v as FeaturedFilter)}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-11 rounded-md text-[11px] font-mono uppercase tracking-[0.2em] min-w-[170px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title · A–Z</SelectItem>
              <SelectItem value="read-asc">Read · Short → Long</SelectItem>
              <SelectItem value="read-desc">Read · Long → Short</SelectItem>
            </SelectContent>
          </Select>

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
              Category · {categoryFilter}
            </button>
          )}
          {authorFilter !== 'all' && (
            <button
              onClick={() => setAuthorFilter('all')}
              className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
              Author · {authorFilter}
            </button>
          )}
          {featuredFilter !== 'all' && (
            <button
              onClick={() => setFeaturedFilter('all')}
              className="inline-flex items-center gap-2 px-2.5 py-1 border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="h-3 w-3" />
              {featuredFilter === 'featured' ? 'Featured Only' : 'Standard Only'}
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
      {paginated.length === 0 ? (
        <div className="border border-border rounded-md p-12 text-left">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            / {hasFilters ? 'No Results' : 'Empty'}
          </p>
          <p className="text-2xl italic font-black uppercase tracking-tighter mb-3">
            {hasFilters ? 'No Matching Articles' : 'No Articles Yet'}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-6">
            {hasFilters
              ? 'Try clearing filters to see all articles.'
              : 'Start by writing your first article for the journal.'}
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
              <Link href="/admin/articles/new">
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Article →
              </Link>
            </Button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((article) => {
            const isSelected = selected.has(article.id)
            return (
              <div
                key={article.id}
                className={cn(
                  'group relative border bg-background transition-colors rounded-md overflow-hidden',
                  isSelected ? 'border-foreground' : 'border-border hover:border-foreground/40'
                )}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  {article.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                  )}

                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectOne(article.id)}
                      className={cn(
                        'rounded-sm h-5 w-5 transition-opacity data-[state=checked]:bg-foreground data-[state=checked]:border-foreground bg-background/90 backdrop-blur',
                        isSelected || selected.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}
                    />
                  </div>

                  {/* Category chip */}
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-foreground/85 backdrop-blur text-background text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                    / {article.category}
                  </span>

                  {/* Featured chip */}
                  {article.featured && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                      <Star className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-md text-[10px] font-mono uppercase tracking-[0.2em] bg-background text-foreground hover:bg-foreground hover:text-background"
                    >
                      <Link href={`/admin/articles/${article.id}`}>
                        <Edit2 className="h-3 w-3 mr-1.5" />
                        Edit
                      </Link>
                    </Button>
                    <button
                      onClick={() => handleToggleFeatured(article)}
                      className={cn(
                        'h-9 w-9 flex items-center justify-center rounded-md border transition-colors',
                        article.featured
                          ? 'bg-accent text-accent-foreground border-accent hover:bg-background hover:text-accent'
                          : 'bg-background text-foreground border-border hover:bg-foreground hover:text-background'
                      )}
                      title={article.featured ? 'Unfeature' : 'Feature'}
                    >
                      <Star className="h-3 w-3" />
                    </button>
                    <Link
                      href={`/blog/${article.id}`}
                      target="_blank"
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
                      title="View on site"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-destructive bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="p-4 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    {formatDateShort(article.publishedAt)}
                  </p>
                  <h3 className="text-sm italic font-black uppercase tracking-tighter line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground line-clamp-2">
                    {article.excerpt || article.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border border-foreground flex items-center justify-center text-[9px] font-mono uppercase tracking-tight rounded-sm">
                        {article.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground truncate">
                        {article.author}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}m
                    </span>
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
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('title')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Article
                      {sortBy === 'title' && <ChevronUp className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Author
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Category
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('date')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Published
                      {sortBy === 'newest' && <ChevronDown className="h-3 w-3" />}
                      {sortBy === 'oldest' && <ChevronUp className="h-3 w-3" />}
                    </span>
                  </th>
                  <th
                    className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => flipSort('read')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Read
                      {sortBy === 'read-asc' && <ChevronUp className="h-3 w-3" />}
                      {sortBy === 'read-desc' && <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((article) => {
                  const isSelected = selected.has(article.id)
                  return (
                    <tr
                      key={article.id}
                      className={cn(
                        'hover:bg-secondary/50 transition-colors group',
                        isSelected && 'bg-secondary/40'
                      )}
                    >
                      <td className="px-5 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(article.id)}
                          className="rounded-sm h-4 w-4 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                        />
                      </td>
                      <td className="px-5 py-4 max-w-md">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 rounded-md bg-secondary border border-border overflow-hidden shrink-0">
                            {article.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={article.image} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs italic font-black uppercase tracking-tighter truncate pr-2">
                                {article.title}
                              </p>
                              {article.featured && (
                                <Star className="h-3 w-3 text-accent fill-accent shrink-0" />
                              )}
                            </div>
                            <Link
                              href={`/blog/${article.id}`}
                              target="_blank"
                              className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 mt-1"
                            >
                              View on Site <ArrowUpRight className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 border border-foreground flex items-center justify-center text-[10px] font-mono uppercase tracking-tight rounded-sm shrink-0">
                            {article.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight">{article.author}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 border border-border rounded-md">
                          / {article.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                          {formatDateShort(article.publishedAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {article.readTime}m
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleFeatured(article)}
                            className={cn(
                              'h-9 w-9 flex items-center justify-center rounded-md border transition-colors',
                              article.featured
                                ? 'border-accent text-accent hover:bg-accent hover:text-accent-foreground'
                                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                            )}
                            title={article.featured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-md">
                            <Link href={`/admin/articles/${article.id}`}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {sorted.length > 0 && (
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
              {bulkAction === 'delete' && 'Delete Articles?'}
              {bulkAction === 'feature' && 'Toggle Featured?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              {bulkAction === 'delete' &&
                `This will permanently delete ${selected.size} article${selected.size === 1 ? '' : 's'}. This cannot be undone.`}
              {bulkAction === 'feature' &&
                `This will toggle the featured flag on ${selected.size} article${selected.size === 1 ? '' : 's'}.`}
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
                <>Confirm →</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
