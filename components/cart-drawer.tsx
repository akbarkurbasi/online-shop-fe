'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, Trash2, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart'
import { useUI } from '@/lib/store/ui'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer'
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
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    toggleItemSelection,
    selectAllItems,
    removeSelectedItems,
    getTotalPrice,
    clearCart
  } = useCart()
  const { isCartOpen, closeCart } = useUI()
  // Total reflects the committed cart state from the store. It only changes
  // after the debounced sync completes — paired with the spinner indicator,
  // this communicates "we'll confirm the price once we update the server".
  const total = getTotalPrice()

  const [confirmConfig, setConfirmConfig] = useState<{
    type: 'single' | 'bulk' | 'clear',
    id?: string
  } | null>(null)

  // Debounced quantity updates: rapid +/- clicks update the UI immediately
  // via `pendingQuantities`, but the backend call fires once, 400ms after the
  // last click. Prevents API spam and the laggy/inconsistent feel.
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({})
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const QTY_DEBOUNCE_MS = 400

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
      timersRef.current = {}
    }
  }, [])

  const scheduleQuantityUpdate = (itemId: string, nextQty: number) => {
    if (nextQty < 1) return
    setPendingQuantities((prev) => ({ ...prev, [itemId]: nextQty }))

    if (timersRef.current[itemId]) clearTimeout(timersRef.current[itemId])

    timersRef.current[itemId] = setTimeout(async () => {
      try {
        await updateQuantity(itemId, nextQty)
      } finally {
        setPendingQuantities((prev) => {
          const next = { ...prev }
          delete next[itemId]
          return next
        })
        delete timersRef.current[itemId]
      }
    }, QTY_DEBOUNCE_MS)
  }

  const displayQty = (id: string, storeQty: number) =>
    pendingQuantities[id] ?? storeQty

  const isSyncing = Object.keys(pendingQuantities).length > 0

  const selectedCount = items.filter(i => i.selected).length
  const allSelected = items.length > 0 && selectedCount === items.length

  const handleConfirmAction = () => {
    if (!confirmConfig) return

    if (confirmConfig.type === 'single' && confirmConfig.id) {
      removeItem(confirmConfig.id)
    } else if (confirmConfig.type === 'bulk') {
      removeSelectedItems()
    } else if (confirmConfig.type === 'clear') {
      clearCart()
      closeCart()
    }
    setConfirmConfig(null)
  }

  return (
    <>
      <Drawer open={isCartOpen} onOpenChange={(open) => !open && closeCart()} direction="right">
        <DrawerContent className="h-full flex flex-col bg-background border-l border-border">
          <DrawerHeader className="px-6 pt-8 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1.5">
                  / Bag · {items.length} {items.length === 1 ? 'piece' : 'pieces'}
                </p>
                <DrawerTitle className="text-2xl italic font-black uppercase tracking-tighter">Shopping Bag</DrawerTitle>
              </div>
              <button
                onClick={closeCart}
                className="h-9 w-9 flex items-center justify-center border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {items.length > 0 && (
              <div className="flex items-center justify-between mt-6 py-3 px-4 border border-border bg-secondary">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={(checked) => selectAllItems(!!checked)}
                    className="rounded-md data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                  />
                  <label htmlFor="select-all" className="text-[10px] font-mono uppercase tracking-[0.3em] cursor-pointer select-none">
                    Select All ({items.length})
                  </label>
                </div>
                {selectedCount > 0 && (
                  <button
                    onClick={() => setConfirmConfig({ type: 'bulk' })}
                    className="text-[10px] font-mono uppercase tracking-[0.3em] text-destructive hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove ({selectedCount})
                  </button>
                )}
              </div>
            )}
          </DrawerHeader>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {items.length === 0 ? (
              <div className="flex flex-col items-start justify-center h-full text-left">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Empty</p>
                <h3 className="text-3xl italic font-black uppercase tracking-tighter mb-3">Your Bag<br />Is Empty</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8">
                  Add a piece from the latest drop to get started.
                </p>
                <Button
                  onClick={closeCart}
                  className="rounded-md h-12 px-8 text-[11px] font-mono uppercase tracking-[0.3em] bg-foreground text-background hover:bg-accent transition-colors"
                >
                  Shop the Drop →
                </Button>
                <ShoppingCart className="absolute right-6 bottom-32 w-32 h-32 text-muted-foreground/5 pointer-events-none" strokeWidth={1} />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="group relative flex gap-4 py-6 first:pt-0 last:pb-0">
                    {/* Selection Checkbox */}
                    <div className="pt-2 shrink-0">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="rounded-md data-[state=checked]:bg-foreground data-[state=checked]:border-foreground h-4 w-4"
                      />
                    </div>

                    {/* Image */}
                    <div className="relative w-24 h-32 bg-secondary flex-shrink-0 overflow-hidden border border-border rounded-md">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1.5">/ {item.category}</p>
                          <h3 className="text-xs font-bold uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => setConfirmConfig({ type: 'single', id: item.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Selected Variants — color renders as a swatch + name; everything else shows the value */}
                      {item.selectedVariants && item.selectedVariants.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {item.selectedVariants.map((v, i) => {
                            const isColor = v.type?.toLowerCase() === 'color'
                            const label = isColor ? v.name : (v.value || v.name)
                            return (
                              <div key={i} className="flex items-center gap-1.5 border border-border px-2 py-0.5">
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                  {v.type}
                                </span>
                                {isColor && /^#[0-9a-f]{3,8}$/i.test(v.value) && (
                                  <span
                                    aria-hidden="true"
                                    className="w-2.5 h-2.5 rounded-sm border border-border shrink-0"
                                    style={{ backgroundColor: v.value }}
                                  />
                                )}
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-foreground">
                                  {label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <p className="text-sm font-bold tracking-tight">
                          {formatPrice(item.price)}
                        </p>

                        {/* Quantity Controls — debounced */}
                        <div className="flex items-center border border-border h-8">
                          <button
                            onClick={() => {
                              const current = displayQty(item.id, item.quantity)
                              if (current <= 1) {
                                setConfirmConfig({ type: 'single', id: item.id })
                              } else {
                                scheduleQuantityUpdate(item.id, current - 1)
                              }
                            }}
                            className="w-7 h-full flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-[11px] font-mono min-w-[1.75rem] text-center border-x border-border h-full flex items-center justify-center">
                            {displayQty(item.id, item.quantity)}
                          </span>
                          <button
                            onClick={() =>
                              scheduleQuantityUpdate(
                                item.id,
                                displayQty(item.id, item.quantity) + 1
                              )
                            }
                            className="w-7 h-full flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <DrawerFooter className="p-6 pt-5 space-y-5 border-t border-border bg-background">
              {/* Order summary */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  <span>/ Subtotal · {selectedCount} {selectedCount === 1 ? 'piece' : 'pieces'}</span>
                  <span className="text-foreground inline-flex items-center gap-1.5">
                    {isSyncing && <Loader2 className="h-3 w-3 animate-spin opacity-60" />}
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  <span>/ Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              {/* Estimated total */}
              <div className="flex justify-between items-end pt-4 border-t border-border">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1 inline-flex items-center gap-1.5">
                    / Estimated Total
                    {isSyncing && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        Syncing
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    {selectedCount === 0 ? 'No items selected' : `${selectedCount} item${selectedCount > 1 ? 's' : ''} selected`}
                  </p>
                </div>
                <span className={cn(
                  "text-3xl italic font-black tracking-tighter transition-colors inline-flex items-center gap-2",
                  selectedCount === 0 ? "text-muted-foreground/40" : "text-accent",
                  isSyncing && "opacity-80"
                )}>
                  {isSyncing && <Loader2 className="h-4 w-4 animate-spin opacity-70" />}
                  {formatPrice(total)}
                </span>
              </div>

              {/* CTAs */}
              <div className="space-y-2.5 pt-1">
                <Button
                  className="w-full h-14 rounded-md text-[11px] font-mono uppercase tracking-[0.3em] bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-30 disabled:grayscale"
                  size="lg"
                  disabled={selectedCount === 0}
                  asChild
                >
                  <Link href="/checkout" onClick={closeCart}>Proceed to Checkout →</Link>
                </Button>
                <button
                  className="w-full text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hover:text-destructive transition-colors py-2"
                  onClick={() => setConfirmConfig({ type: 'clear' })}
                >
                  / Clear All Items
                </button>
              </div>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmConfig} onOpenChange={() => setConfirmConfig(null)}>
        <AlertDialogContent className="rounded-md border border-border">
          <AlertDialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Confirm</p>
            <AlertDialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              Remove from Bag?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              {confirmConfig?.type === 'single' && 'Remove this piece from your bag? You can always add it back later.'}
              {confirmConfig?.type === 'bulk' && `Remove ${selectedCount} selected piece${selectedCount === 1 ? '' : 's'} from your bag?`}
              {confirmConfig?.type === 'clear' && 'This will empty your bag completely. Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-md h-12 px-6 text-[11px] font-mono uppercase tracking-[0.3em]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="rounded-md h-12 px-8 text-[11px] font-mono uppercase tracking-[0.3em] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Remove →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
