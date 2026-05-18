'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Product } from '@/lib/types'
import { productService } from '@/services/productService'
import { formatPrice, cn } from '@/lib/utils'

export function VariantList() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts()
        setProducts(data.data.items || [])
      } catch (error) {
        console.error('Error fetching products for variants:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({
      ...v,
      productName: p.name,
      productId: p.id,
      category: p.category,
    }))
  ).filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Loading variants…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-6 border-b border-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Variants</p>
          <h2 className="text-2xl italic font-black uppercase tracking-tighter">All Variants</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-2">
            {allVariants.length} {allVariants.length === 1 ? 'variant' : 'variants'} across {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search variants…"
            className="pl-9 h-11 rounded-md text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Variant</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Product</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Price</th>
                <th className="px-5 py-3 text-left text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allVariants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
                    <p className="text-base italic font-black uppercase tracking-tighter">No Variants Found</p>
                  </td>
                </tr>
              ) : (
                allVariants.map((variant, index) => (
                  <tr key={`${variant.productId}-${index}`} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold uppercase tracking-tight">{variant.name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 border border-border rounded-md">
                        / {variant.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs italic font-black uppercase tracking-tighter line-clamp-1">{variant.productName}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                        / {variant.category}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {typeof variant.price === 'number' ? (
                        <p className="text-sm italic font-black tracking-tighter">{formatPrice(variant.price)}</p>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'text-[11px] font-mono uppercase tracking-[0.2em]',
                          variant.stock > 0 ? 'text-foreground' : 'text-destructive'
                        )}
                      >
                        {variant.stock} units
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
