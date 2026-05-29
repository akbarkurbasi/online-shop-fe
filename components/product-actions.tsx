'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useCart } from '@/lib/store/cart'
import { useAuth } from '@/lib/store/auth'
import { productService } from '@/services/productService'
import type { Product, Variant } from '@/lib/types'
import { cn, formatPrice } from '@/lib/utils'

// Notify the global AddedToBagNotification component (mounted in app/layout.tsx)
// to show a mini panel + bounce the header cart icon. Safe on SSR.
function notifyAddedToBag(detail: { name: string; image: string; price: number; category: string }) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cart:added', { detail }))
}

interface ProductActionsProps {
  product: Product
}

export function ProductActions({ product }: ProductActionsProps) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Variant>>({})
  const [error, setError] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Track product view interaction on mount
  useEffect(() => {
    if (user && product?.id) {
      const userIdNum = parseInt(user.id, 10)
      if (!isNaN(userIdNum)) {
        productService.trackInteraction(userIdNum, product.id, 'view').catch(console.error)
      }
    }
  }, [user, product?.id])

  // Group variants by type
  const variantGroups = product.variants?.reduce((acc, variant) => {
    if (!acc[variant.type]) acc[variant.type] = []
    acc[variant.type].push(variant)
    return acc
  }, {} as Record<string, Variant[]>) || {}

  const variantTypes = Object.keys(variantGroups)

  // Calculate current price based on selected variants
  const getCurrentPrice = () => {
    let total = product.price

    // In this simplified logic, we take the price of the "primary" variant if it has one
    // or sum adjustments. Most e-commerce use "Variant Price" as the final price.

    const selectedList = Object.values(selectedVariants)

    // If any selected variant has an explicit price, use the highest one (or logic that fits)
    // Here we'll take the price from the variant if set, otherwise add adjustments
    const explicitPrice = selectedList.find(v => v.price != null)?.price
    if (explicitPrice != null) {
      total = explicitPrice
    }

    selectedList.forEach(v => {
      if (v.priceAdjustment) total += v.priceAdjustment
    })

    return total
  }

  const currentPrice = getCurrentPrice()

  // Variant-aware stock: when one or more variants are picked, take the MIN
  // of their stocks (conservative — you need every chosen variant in stock).
  // Falls back to product.stock when nothing is selected yet.
  const selectedList = Object.values(selectedVariants)
  const currentStock = selectedList.length > 0
    ? Math.min(...selectedList.map(v => v.stock))
    : product.stock
  const currentInStock = currentStock > 0

  // Keep quantity clamped to available stock — auto-correct if a variant change
  // brings stock below the user's current quantity.
  useEffect(() => {
    if (currentStock > 0 && quantity > currentStock) {
      setQuantity(currentStock)
    }
  }, [currentStock, quantity])

  const handleAddToCart = () => {
    // Validation: Ensure all variant types have a selection
    const missingTypes = variantTypes.filter(type => !selectedVariants[type])
    if (missingTypes.length > 0) {
      setError(`Please select ${missingTypes[0]}`)
      return
    }

    setError(null)

    // Auth gate: guests must sign in first. Show a confirmation dialog
    // instead of pushing them off the page silently.
    if (!user) {
      setShowLoginDialog(true)
      return
    }

    const selections = Object.values(selectedVariants)
    const variantSuffix = selections.map(v => v.id).sort().join('_')
    const cartItemId = variantSuffix ? `${product.id}_${variantSuffix}` : product.id

    addItem({
      id: cartItemId,
      product_id: product.id,
      name: product.name,
      price: currentPrice,
      quantity,
      image: product.image,
      category: product.category,
      selectedVariants: selections.map(v => ({
        type: v.type,
        name: v.name,
        value: v.value
      })),
      selected: false
    })

    notifyAddedToBag({
      name: product.name,
      image: product.image,
      price: currentPrice,
      category: product.category,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Dynamic Price Display inside Actions for clarity */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-4">
          <span className="text-4xl font-extrabold tracking-tighter text-primary">
            {formatPrice(currentPrice)}
          </span>
          {product.originalPrice && currentPrice <= product.price && (
            <span className="text-xl text-muted-foreground line-through decoration-destructive/40 font-medium">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          / Unit Price · {Object.values(selectedVariants).map(v => v.name).join(' ') || 'Base'}
        </p>
      </div>

      <div className="h-px bg-border/50" />

      {/* Variant Selections */}
      <div className="space-y-6">
        {variantTypes.map((type) => (
          <div key={type}>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] mb-3 text-muted-foreground">
              / Select {type}: <span className="text-foreground font-bold ml-2">{selectedVariants[type]?.name || ''}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {variantGroups[type].map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariants(prev => {
                      if (prev[type]?.id === variant.id) {
                        const { [type]: _removed, ...rest } = prev
                        return rest
                      }
                      return { ...prev, [type]: variant }
                    })
                    setError(null)
                  }}
                  className={`min-w-[64px] h-12 px-4 rounded-md border font-bold transition-colors text-xs flex flex-col items-center justify-center gap-0.5 ${selectedVariants[type]?.id === variant.id
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                >
                  <span>{variant.name}</span>
                  {variant.price && (
                    <span className={`text-[9px] opacity-70 ${selectedVariants[type]?.id === variant.id ? 'text-primary-foreground' : 'text-primary'}`}>
                      {formatPrice(variant.price)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm font-medium animate-in fade-in slide-in-from-left-1 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stock indicator (variant-aware) */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em]">
        <span className={cn(
          'inline-flex items-center gap-2 px-2.5 py-1 border rounded-md',
          !currentInStock
            ? 'border-destructive text-destructive'
            : currentStock <= 5
              ? 'border-accent text-accent'
              : 'border-border text-muted-foreground'
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {!currentInStock
            ? 'Sold Out'
            : currentStock <= 5
              ? `Only ${currentStock} Left`
              : `${currentStock} In Stock`}
        </span>
        <span className="text-muted-foreground">
          / {selectedList.length > 0 ? selectedList.map(v => v.name).join(' · ') : 'Base'}
        </span>
      </div>

      {/* Quantity & Add to Cart */}
      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center border border-border bg-background overflow-hidden h-14 rounded-md">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={!currentInStock}
            className="px-5 h-full hover:bg-secondary transition font-bold text-lg disabled:opacity-30 disabled:hover:bg-transparent"
          >
            −
          </button>
          <span className="w-12 text-center font-bold">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
            disabled={!currentInStock || quantity >= currentStock}
            className="px-5 h-full hover:bg-secondary transition font-bold text-lg disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={!currentInStock}
          className="flex-1 h-14 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]"
          size="lg"
        >
          <ShoppingCart className="h-4 w-4 mr-3" />
          {currentInStock ? 'Add to Cart' : 'Sold Out'}
        </Button>
      </div>

      {/* Sign-in required dialog (shown when a guest tries to add to cart) */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Sign In Required</p>
            <AlertDialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              Sign in to add to bag
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              You need an account to save items in your bag and check out. Sign in now — we&apos;ll bring you right back to this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLoginDialog(false)
                const returnTo = pathname ? `?returnTo=${encodeURIComponent(pathname)}` : ''
                router.push(`/auth/login${returnTo}`)
              }}
              className="rounded-md h-11 px-6 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Sign In →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
