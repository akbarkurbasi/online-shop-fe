'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { useAuth } from '@/lib/store/auth'
import { productService } from '@/services/productService'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()
  const isSoldOut = !product.inStock || product.stock === 0
  const isLowStock = !isSoldOut && product.stock > 0 && product.stock <= 5
  const isOnSale =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price
  const discountPct = isOnSale
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  // Priority-ordered single badge (top-left). Avoids three-chip clutter.
  const badge: { label: string; tone: 'mute' | 'accent' | 'warn' | 'sale' } | null = isSoldOut
    ? { label: 'Sold Out', tone: 'mute' }
    : isOnSale
      ? { label: `Sale −${discountPct}%`, tone: 'sale' }
      : product.featured
        ? { label: 'Featured', tone: 'accent' }
        : isLowStock
          ? { label: `Only ${product.stock} Left`, tone: 'warn' }
          : null

  const colorVariants = product.variants?.filter((v) => v.type === 'color') ?? []

  const handleTrackClick = () => {
    if (user) {
      const userIdNum = parseInt(user.id, 10)
      if (!isNaN(userIdNum)) {
        productService.trackInteraction(userIdNum, product.id, 'click').catch(console.error)
      }
    }
  }

  return (
    <Link
      href={`/products/${product.id}`}
      onClick={handleTrackClick}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
      aria-disabled={isSoldOut}
    >
      <article className="flex h-full flex-col">
        {/* Image */}
        <div
          className={cn(
            'relative aspect-[4/5] overflow-hidden rounded-md bg-secondary border border-border',
            isSoldOut && 'grayscale opacity-80',
          )}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Status badge (top-left) */}
          {badge && (
            <span
              className={cn(
                'absolute top-2.5 left-2.5 inline-flex items-center px-2 py-1',
                'text-[9px] font-mono uppercase tracking-[0.25em] rounded-sm',
                badge.tone === 'mute' && 'bg-foreground text-background',
                badge.tone === 'sale' && 'bg-accent text-background',
                badge.tone === 'accent' && 'bg-background/95 text-foreground border border-foreground',
                badge.tone === 'warn' && 'bg-background/95 text-accent border border-accent/40',
              )}
            >
              {badge.label}
            </span>
          )}

          {/* Rating (top-right) */}
          {product.rating > 0 && (
            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-background/95 text-foreground px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] rounded-sm">
              ★ {product.rating.toFixed(1)}
            </span>
          )}

          {/* Hover affordance — subtle pill, bottom-right */}
          {!isSoldOut && (
            <span
              className="absolute bottom-2.5 right-2.5 inline-flex items-center bg-foreground text-background px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.3em] rounded-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
            >
              View →
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col pt-3.5">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1.5">
            / {product.category}
          </p>

          <h3 className="text-sm font-bold uppercase tracking-tight line-clamp-1 leading-snug group-hover:text-accent transition-colors mb-2.5">
            {product.name}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-3">
            {/* Color swatches */}
            {colorVariants.length > 0 ? (
              <div className="flex items-center gap-1">
                {colorVariants.slice(0, 5).map((v) => (
                  <span
                    key={v.id}
                    className="w-3 h-3 rounded-sm border border-border"
                    style={{ backgroundColor: v.value }}
                    title={v.name}
                    aria-label={v.name}
                  />
                ))}
                {colorVariants.length > 5 && (
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground ml-0.5">
                    +{colorVariants.length - 5}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                {product.variants?.some((v) => v.type === 'size') ? 'XS – XL' : ' '}
              </span>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 shrink-0">
              {isOnSale && (
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
              <span
                className={cn(
                  'text-sm font-bold tracking-tight',
                  isOnSale && 'text-accent',
                )}
              >
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
