'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUI } from '@/lib/store/ui'
import { formatPrice, cn } from '@/lib/utils'

export type AddedToBagDetail = {
  name: string
  image: string
  price: number
  category: string
}

/**
 * Global mini notification mounted once in the root layout.
 *
 * Listens for a `cart:added` CustomEvent with detail of shape `AddedToBagDetail`
 * and shows a small bordered panel in the top-right that auto-dismisses after
 * a few seconds. Also pulses the header cart icon (anything tagged
 * `[data-cart-target]`).
 *
 * Triggered from anywhere with:
 *   window.dispatchEvent(new CustomEvent('cart:added', { detail: {...} }))
 */
export function AddedToBagNotification() {
  const [item, setItem] = useState<AddedToBagDetail | null>(null)
  const [visible, setVisible] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toggleCart } = useUI()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AddedToBagDetail>).detail
      if (!detail) return

      // Reflect the latest add and reset the auto-dismiss timer
      setItem(detail)
      setVisible(true)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = setTimeout(() => setVisible(false), 4000)

      // Bounce the header cart icon
      const target = document.querySelector<HTMLElement>('[data-cart-target]')
      if (target) {
        target.classList.remove('cart-pulse')
        // re-trigger by forcing reflow then re-adding the class
        void target.offsetWidth
        target.classList.add('cart-pulse')
        window.setTimeout(() => target.classList.remove('cart-pulse'), 500)
      }
    }
    window.addEventListener('cart:added', handler as EventListener)
    return () => window.removeEventListener('cart:added', handler as EventListener)
  }, [])

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [])

  const handleViewBag = () => {
    setVisible(false)
    toggleCart()
  }

  const handleClose = () => {
    setVisible(false)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
  }

  if (!item) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-24 md:top-28 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] border border-border bg-background rounded-md shadow-xl transition-all duration-300 ease-out',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
      )}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Added to Bag
        </p>
        <button
          onClick={handleClose}
          className="h-7 w-7 flex items-center justify-center border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors rounded-sm"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="h-16 w-16 bg-secondary border border-border rounded-md overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1 truncate">
            / {item.category}
          </p>
          <h4 className="text-xs italic font-black uppercase tracking-tighter line-clamp-1 leading-tight">
            {item.name}
          </h4>
          <p className="text-sm font-bold tracking-tight mt-1.5">{formatPrice(item.price)}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleViewBag}
          className="w-full rounded-md h-11 text-[11px] font-mono uppercase tracking-[0.3em]"
        >
          View Bag
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
