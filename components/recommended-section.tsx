'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { productService } from '@/services/productService'
import { useAuth } from '@/lib/store/auth'
import { ProductCard } from '@/components/product-card'
import { Stagger, Item } from '@/components/motion/Stagger'
import type { Product } from '@/lib/types'

// Fallback queries to cycle through when no user is present
const FALLBACK_QUERIES = ['pakaian kasual terbaik', 'jaket pria keren', 'sepatu sneakers populer']

export function RecommendedSection() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      try {
        const userId = user ? parseInt(user.id, 10) : undefined
        const query = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)]
        const result = await productService.getRecommendations(
          query,
          userId && !isNaN(userId) ? userId : undefined
        )
        if (!cancelled) {
          setProducts((result.products || []).slice(0, 4))
          setIsFallback(result.is_fallback ?? false)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [user])

  // Don't render the section at all if empty after loading
  if (!loading && products.length === 0) return null

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-end mb-12 border-b border-border pb-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3 flex items-center gap-2">
              <Sparkles className="h-3 w-3 animate-pulse" />
              / Volt AI
            </p>
            <h2 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">
              {user ? 'For You' : 'Rekomendasi Pilihan'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm">
              {user
                ? `Pilihan personal AI berdasarkan preferensi ${user.name.split(' ')[0]}`
                : 'Dikurasi oleh AI dari koleksi terbaik kami'}
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition"
          >
            Lihat Semua <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] rounded-xl bg-secondary/40 animate-pulse" />
                <div className="h-3 w-3/4 bg-secondary/40 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-secondary/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <Item key={product.id}>
                <ProductCard product={product} />
              </Item>
            ))}
          </Stagger>
        )}

        {/* Fallback disclaimer */}
        {!loading && isFallback && (
          <p className="mt-6 text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50">
            * Rekomendasi umum — login untuk rekomendasi personal
          </p>
        )}
      </div>
    </section>
  )
}
